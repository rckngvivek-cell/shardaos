# ADR-012: SMS Template System

**Status:** ACCEPTED  
**Date:** April 10, 2026  
**Deciders:** Backend Agent, Lead Architect  
**Consulted:** Product Agent, QA Agent, Data Agent  
**Informed:** All agents

## Context

Week 5 introduces SMS notifications as a parent engagement channel. Schools require consistent, professional messaging across multiple scenarios: attendance, grades, announcements, fee reminders. Message templates must support:

- Dynamic variable substitution (parent name, student name, etc.)
- Multi-language support (English, Hindi, local language)
- Rate limiting per recipient to prevent spam
- Regulatory compliance (TRAI guidelines, opt-out links)
- Cost estimation and billing
- A/B testing capabilities

**Requirements:**
- 4+ message templates (attendance, grades, announcement, fee)
- Dynamic variables ({{parentName}}, {{studentName}}, etc.)
- Multi-language rendering (i18n)
- Template versioning for A/B tests
- Rich text support (bold, emoji, line breaks)
- Scheduled sending (delayed delivery)
- Opt-out mechanisms (TRAI compliance)
- 160-character limit per SMS (GSM-7)

**Constraints:**
- SMS character limit: 160 characters (GSM-7) or 70 (Unicode)
- Template rendering: <100ms per message
- Compliance: Mandatory sender ID, no promotional content rules
- Rate limit: 5 SMS/hour per phone
- Cost: ₹0.50-₹1.00 per SMS

## Decision

**We implement a template system with:**
1. **Database-backed templates** (Firestore collections)
2. **Mustache templating** for variable substitution
3. **i18n via ICU message format** for multi-language
4. **Firebase Cloud Tasks** for async delivery with retry

### Rationale

#### 1. Database-Backed Templates (Not Hardcoded)

**Why not hardcode templates?**
- Schools need to customize messages (school name, fees, colors)
- A/B testing requires template versioning
- Support for different term/academic calendar
- Regulatory changes require quick updates

**Template Storage in Firestore:**

```
/schools/{schoolId}/sms-templates/
├── attendance/
│   ├── version: 1
│   ├── language: 'en'
│   ├── content: 'Hi {{parentName}}, {{studentName}} was present today in {{subjects}}'
│   ├── status: 'active'
│   └── createdAt: timestamp
├── grades/
│   ├── version: 1
│   ├── language: 'en'
│   ├── content: 'Hi {{parentName}}, {{studentName}} scored {{marks}}/100 in {{subject}} ({{grade}})'
└── fee-reminder/
    ├── version: 1
    ├── language: 'en'
    └── content: 'Hi {{parentName}}, Fee ₹{{amount}} for {{studentName}} is due by {{dueDate}}'
```

#### 2. Template Rendering Pipeline

```
Event Trigger (Student marked present)
       │
       ▼
┌─────────────────────────────┐
│ GET Template from Firestore │
│ - Lookup by schoolId        │
│ - Lookup by templateId      │
│ - Cache in Redis (5 min TTL)│
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ EXTRACT Variables           │
│ - studentId → getName()    │
│ - parentId → getPhone()    │
│ - classId → getSubjects()  │
│ - Parallel queries (async) │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ RENDER Template             │
│ - Substitute {{variables}} │
│ - Apply language transform  │
│ - Check GSM-7 compatibility │
│ - <100ms rendering time     │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ CHECK Compliance            │
│ - Verify character count    │
│ - Ensure no blacklist words │
│ - Check rate limit (Redis)  │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ ENQUEUE Task                │
│ - Cloud Tasks queue         │
│ - Twilio SMS send           │
│ - Delivery tracking         │
└─────────────────────────────┘
```

#### 3. Mustache Templating

**Why Mustache?**

| Aspect | Mustache | EJS | Handlebars |
|--------|----------|-----|-----------|
| **Syntax** | `{{var}}` | `<%= var %>` | `{{#if}}...{{/if}}` |
| **Logic** | No logic (safe) | Full JS | Helpers + logic |
| **Security** | HTML-escape by default | Requires careful escaping | HTML-escape by default |
| **Learning** | 5 minutes | 15 minutes | 30 minutes |
| **Bundle size** | 10KB | 8KB | 20KB |
| **Use case** | Simple substitution | Complex rendering | Complex logic |

**Our choice: Mustache** because:
- SMS templates are simple (no conditionals)
- Schools shouldn't need to learn templating logic
- Security: no way to execute arbitrary code
- Fast (library pre-compiled)

```typescript
// Template
const template = 'Hi {{parentName}}, {{studentName}} was present in {{subjects}}';

// Variables
const variables = {
  parentName: 'Mr. Sharma',
  studentName: 'Rohan',
  subjects: 'Math, English, Science'
};

// Render
const message = mustache.render(template, variables);
// Result: 'Hi Mr. Sharma, Rohan was present in Math, English, Science'

// Validation
validateGSM7(message);  // Check 160-char limit
validateCompliance(message);  // No blacklist words
```

#### 4. I18n Support (ICU Message Format)

**Multi-language example:**

```json
{
  "attendance": {
    "en": {
      "content": "Hi {{parentName}}, {{studentName}} was present today",
      "charLimit": 160
    },
    "hi": {
      "content": "नमस्ते {{parentName}}, {{studentName}} आज अवश्य उपस्थित था",
      "charLimit": 160
    },
    "gu": {
      "content": "હેલો {{parentName}}, {{studentName}} આજે ઉપસ્થિત હતો",
      "charLimit": 160
    }
  }
}
```

**Selection logic:**
1. Get parent's language preference from user profile
2. Fallback to school default language (usually English or regional)
3. Fallback to English if all else fails

#### 5. Character Counting (GSM-7 vs Unicode)

**GSM-7 Encoding (160 characters max):**
- Supports: A-Z, a-z, 0-9, common punctuation, space
- Supported: `@`, `@`, `£`, `¥`, `è`, `é`, `ù`, `€` (special GSM chars)
- **Cost:** 1 SMS per message

**Unicode (70 characters max):**
- Supports: Hindi, Gujarati, Tamil, etc.
- **Cost:** 1 SMS = 70 chars (vs 160 for ASCII)

**Our strategy:**
1. Check if message fits GSM-7
2. If yes: send as-is (160 chars, 1 SMS)
3. If no (contains unicode): split into 3 parts at 67 chars each (3 SMS)
4. Calculate cost upfront and show to school

```typescript
function calculateSMSCount(message) {
  if (isGSM7Compatible(message)) {
    return Math.ceil(message.length / 160);  // Maximum 1 for templates
  } else {
    return Math.ceil(message.length / 70);   // Unicode: 1 SMS per 70 chars
  }
}

// Example
'Hi {{parentName}}, {{studentName}} scored {{marks}}/100 in {{subject}}'
 → GSM-7 compatible → 1 SMS
 → Cost: ₹0.50

'नमस्ते {{parentName}}, {{studentName}} क्षण के लिए साथ रहे'
 → Unicode → 2 SMS
 → Cost: ₹1.00
```

#### 6. Template Versioning for A/B Testing

```json
{
  "templateId": "attendance",
  "schoolId": "school-123",
  "versions": [
    {
      "version": 1,
      "content": "Hi {{parentName}}, {{studentName}} was present",
      "status": "active",
      "createdAt": "2026-04-10T10:00:00Z",
      "activeFrom": "2026-04-10T10:00:00Z",
      "abTest": null
    },
    {
      "version": 2,
      "content": "Attendance Update: {{studentName}} present on {{date}}",
      "status": "testing",
      "createdAt": "2026-04-11T09:00:00Z",
      "abTest": {
        "trafficSplit": 0.1,  // 10% testers get v2
        "metrics": ["clickThrough", "optOut"],
        "winner": null
      }
    }
  ]
}
```

## Implementation

### File Structure

```
apps/api/src/modules/sms-templates/
├── controllers/
│   └── sms-template.controller.ts          // GET/POST/PUT templates
├── services/
│   ├── template.service.ts                 // CRUD operations
│   ├── template-renderer.service.ts        // Render + validate
│   └── compliance.service.ts               // Rate limit + regulations
├── utils/
│   ├── mustache-renderer.ts                // Template logic
│   ├── gsm7-validator.ts                   // Character encoding check
│   ├── i18n.ts                             // Language selection
│   └── template-compiler.ts                // Pre-compile templates
├── types/
│   └── sms-template.types.ts
└── __tests__/
    ├── template-renderer.test.ts           (<100ms target)
    ├── gsm7-validator.test.ts              (encoding edge cases)
    ├── i18n.test.ts                        (language fallback)
    └── template.integration.test.ts        (end-to-end)
```

### API Contract

```typescript
// GET all templates for school
GET /api/v1/schools/{schoolId}/sms-templates
Response: {
  templates: [
    {
      id: 'attendance',
      name: 'Attendance Notification',
      content: 'Hi {{parentName}}, {{studentName}} was present',
      variables: ['parentName', 'studentName', 'subjects'],
      versions: 2,
      activeVersion: 1,
      language: 'en',
      status: 'active'
    }
  ]
}

// CREATE new template
POST /api/v1/schools/{schoolId}/sms-templates
{
  id: 'custom-msg',
  name: 'Custom Message',
  content: 'Hello {{parentName}}, {{message}}',
  language: 'en',
  estimatedCost: 0.50  // Per SMS
}

// RENDER template (test before saving)
POST /api/v1/schools/{schoolId}/sms-templates/{id}/preview
{
  variables: {
    parentName: 'Mr. Sharma',
    studentName: 'Rohan',
    subjects: 'Math, English'
  }
}

Response:
{
  rendered: 'Hi Mr. Sharma, Rohan was present in Math, English',
  charCount: 58,
  smsCost: 0.50,
  valid: true,
  warnings: []
}

// SEND SMS using template
POST /api/v1/schools/{schoolId}/sms/send
{
  templateId: 'attendance',
  recipients: [
    { phone: '9876543210', variables: { parentName: 'Mr. Sharma', ... } }
  ]
}
```

### Template Examples

**Attendance:**
```
Attendance: {{studentName}} ({{class}}) marked present. Date: {{date}}
→ 82 chars (GSM-7) = 1 SMS = ₹0.50
```

**Grades:**
```
{{studentName}} scored {{marks}}/100 in {{subject}}. Grade: {{grade}}
→ Cost depends on length
```

**Fee Reminder:**
```
Fee: ₹{{amount}} for {{studentName}} due by {{dueDate}}.
→ Links to online payment or contact principal
```

**Announcement:**
```
{{schoolName}}: {{message}} - {{date}}
→ School can customize as needed
```

### Rendering Performance (<100ms)

**Caching Strategy:**
- Cache compiled templates in Redis (5 min TTL)
- Cache variable lookups (nameMap, subjectMap)
- Pre-compile Mustache templates on creation

```typescript
// Optimized rendering
async function renderMessage(
  schoolId,
  templateId,
  variables
) {
  // Check Redis cache first
  const cached = await redis.get(`template:${schoolId}:${templateId}`);
  const template = cached || await loadTemplate(schoolId, templateId);
  
  // Render (ms, not seconds)
  const message = mustache.render(template.content, variables);
  
  // Validate (ms)
  validateGSM7(message);
  validateCompliance(message);
  
  return { message, cost: calculateCost(message) };
}

// Typical execution: 15-50ms total
```

## Consequences

### Positive
- ✅ Schools can customize messages (competitive advantage)
- ✅ A/B testing enables optimization
- ✅ Multi-language support reaches diverse parent base
- ✅ Template versioning prevents accidental breaking changes
- ✅ Regulatory compliance built-in

### Negative
- ⚠️ Schools might create non-compliance messages (requires moderation)
- ⚠️ Character counting complex with Unicode
- ⚠️ Template variable names must be standardized

## Testing Strategy

**Unit Tests:**
- Render template with variables ✓
- Handle missing variables (graceful fallback) ✓
- Count characters correctly (GSM-7 vs Unicode) ✓
- Multi-language rendering ✓
- Pre-compile performance <50ms ✓

**Integration Tests:**
- Save template → Load → Render → Send SMS ✓
- Template versioning with A/B split ✓
- Unicode template → SMS split correctly ✓

**Performance Tests:**
- Rendering: <50ms per message
- Caching: Redis hit in <5ms

---

**Next Steps:**
- Day 1: Design template storage schema
- Day 2: Implement Mustache rendering
- Day 3: Add GSM-7 validation
- Day 4: Multi-language support & caching
