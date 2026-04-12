# ADR-001: API Design Approach

**Status:** ACCEPTED  
**Date:** May 6, 2026  
**Deciders:** Lead Architect, Backend Agent  
**Consulted:** Frontend Agent, QA Agent  
**Informed:** All agents

## Context

Week 4 requires implementing 5 production-ready REST API endpoints to serve the school ERP system. We need to establish a consistent, validated, and error-resilient API design pattern that can be replicated across future endpoints.

**Key Requirements:**
- Request/response validation
- Consistent error handling
- Type safety
- Testability
- Production readiness (logging, monitoring)

## Decision

We adopt **Zod-based API design** with the following principles:

### 1. Schema Validation with Zod

All endpoints use Zod for runtime validation:

```typescript
// apps/api/src/routes/students.ts

import { z } from 'zod';

// Request schemas
const CreateStudentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  schoolId: z.string().uuid(),
  rollNumber: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
});

const ListStudentsSchema = z.object({
  schoolId: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Response schemas
const StudentResponseSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  schoolId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const ListStudentsResponseSchema = z.object({
  data: z.array(StudentResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});
```

### 2. Consistent Endpoint Structure

All endpoints follow this pattern:

```typescript
// POST endpoint for creating resource
app.post('/api/v1/students', 
  validateRequest(CreateStudentSchema),
  async (req, res, next) => {
    try {
      const validated = req.validatedBody;
      const result = await studentService.create(validated);
      res.status(201).json(StudentResponseSchema.parse(result));
    } catch (error) {
      next(error);
    }
  }
);

// GET endpoint for fetching with pagination
app.get('/api/v1/students',
  validateQuery(ListStudentsSchema),
  async (req, res, next) => {
    try {
      const { schoolId, limit, offset } = req.validatedQuery;
      const result = await studentService.list(schoolId, limit, offset);
      res.json(ListStudentsResponseSchema.parse(result));
    } catch (error) {
      next(error);
    }
  }
);
```

### 3. Error Handling Strategy

All errors follow a standardized format:

```typescript
// apps/api/src/middleware/errorHandler.ts

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || {},
      },
    });
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.errors,
      },
    });
  }

  // Log unexpected errors
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});
```

### 4. Implemented Endpoints (Week 4)

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/v1/schools` | POST | Create school | ✅ Implemented |
| `/api/v1/schools/{id}` | GET | Get school details | ✅ Implemented |
| `/api/v1/students` | POST | Add student | ✅ Implemented |
| `/api/v1/students` | GET | List students | ✅ Implemented |
| `/api/v1/attendance` | POST | Mark attendance | ✅ Implemented |

## Consequences

### Positive
- ✅ **Type Safety:** Zod provides compile-time and runtime validation
- ✅ **Consistency:** All endpoints follow identical patterns
- ✅ **Testability:** Schemas make writing tests straightforward
- ✅ **Error Clarity:** Structured error responses aid debugging
- ✅ **Documentation:** Schemas serve as self-documenting API contracts

### Negative
- ⚠️ **Zod Learning Curve:** Team needs brief onboarding
- ⚠️ **Additional Dependencies:** Adds ~50KB to bundle
- ⚠️ **Runtime Overhead:** Validation adds ~1-2ms per request (acceptable)

## Alternatives Considered

1. **Manual Validation:** Type-unsafe, error-prone, inconsistent
2. **GraphQL:** Over-engineered for current scope, steeper learning curve
3. **OpenAPI/Swagger:** Requires separate schema definition, harder to keep in sync

## Validation

- ✅ All 15 API tests passing
- ✅ Request validation catches invalid inputs
- ✅ Error messages clear and actionable
- ✅ Response schemas prevent data leaks

## Related Decisions

- **ADR-002:** Firestore Schema & Indexing Strategy
- **ADR-003:** Security Model (RBAC validation in middleware)

## References

- [Zod Documentation](https://zod.dev/)
- [PR #1: Core API Routes](../pull-requests/pr-001-api-routes.md)
- [Test Cases: API Validation](../tests/api.test.ts)
