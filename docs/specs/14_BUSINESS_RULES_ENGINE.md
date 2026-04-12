# BUSINESS RULES ENGINE - Grades, Attendance & Promotion Logic
## Complex Calculations, Algorithms & Academic Rules

**Version:** 1.0.0  
**Date:** April 9, 2026  
**Status:** Production-Ready  

---

# PART 1: CONFIGURABLE ACADEMIC RULES

## Rule Engine Architecture

```typescript
// src/services/rules-engine.ts
interface AcademicRule {
  ruleId: string;
  name: string;
  description: string;
  schoolId: string;
  category: 'grading' | 'promotion' | 'attendance' | 'eligibility';
  enabled: boolean;
  config: Record<string, any>;
}

class RulesEngine {
  async applyRule(
    ruleId: string,
    context: RuleContext
  ): Promise<RuleResult> {
    const rule = await this.getRule(ruleId);
    
    switch (rule.category) {
      case 'grading':
        return this.applyGradingRule(rule, context);
      case 'promotion':
        return this.applyPromotionRule(rule, context);
      case 'attendance':
        return this.applyAttendanceRule(rule, context);
      case 'eligibility':
        return this.applyEligibilityRule(rule, context);
      default:
        throw new Error(`Unknown rule category: ${rule.category}`);
    }
  }
}
```

---

# PART 2: GRADING SYSTEM

## Multiple Grading Scales

```typescript
// Grading Scale Configurations
export const GRADING_SCALES = {
  // CBSE Guidelines
  CBSE_10_POINT: {
    name: 'CBSE 10-Point Scale',
    grades: [
      { grade: 'A+', minMarks: 90, maxMarks: 100 },
      { grade: 'A', minMarks: 80, maxMarks: 89 },
      { grade: 'B+', minMarks: 70, maxMarks: 79 },
      { grade: 'B', minMarks: 60, maxMarks: 69 },
      { grade: 'C+', minMarks: 50, maxMarks: 59 },
      { grade: 'C', minMarks: 40, maxMarks: 49 },
      { grade: 'D', minMarks: 30, maxMarks: 39 },
      { grade: 'E1', minMarks: 21, maxMarks: 29 },
      { grade: 'E2', minMarks: 0, maxMarks: 20 },
    ],
  },

  // 5-Point Scale
  FIVE_POINT: {
    name: '5-Point Scale',
    grades: [
      { grade: 'A', minMarks: 80, maxMarks: 100 },
      { grade: 'B', minMarks: 60, maxMarks: 79 },
      { grade: 'C', minMarks: 40, maxMarks: 59 },
      { grade: 'D', minMarks: 20, maxMarks: 39 },
      { grade: 'E', minMarks: 0, maxMarks: 19 },
    ],
  },
};

// Grade calculation with weightage
export async function calculateGradeWithWeightage(
  schoolId: string,
  studentId: string,
  subjectId: string,
  term: 'term1' | 'term2' | 'annual'
): Promise<GradeResult> {
  // Get weightage rules
  const config = await firestore
    .collection('schools')
    .doc(schoolId)
    .collection('config')
    .doc('grading')
    .get();

  const weightages = config.data()?.weightages || {
    'assessment1': 10,
    'assessment2': 10,
    'periodical1': 15,
    'periodical2': 15,
    'final': 50,
  };

  // Fetch marks for each component
  const marks = await firestore
    .collection('grades')
    .where('schoolId', '==', schoolId)
    .where('studentId', '==', studentId)
    .where('subjectId', '==', subjectId)
    .where('term', '==', term)
    .get();

  let totalWeightedMarks = 0;
  let totalWeight = 0;

  marks.docs.forEach((doc) => {
    const data = doc.data();
    const weight = weightages[data.component] || 0;
    totalWeightedMarks += data.obtainedMarks * (weight / 100);
    totalWeight += weight;
  });

  const finalMarks = totalWeightedMarks / (totalWeight / 100);
  const grade = getGradeFromMarks(finalMarks);

  Logger.info(`Grade calculated`, {
    schoolId,
    studentId,
    subjectId,
    term,
    finalMarks: finalMarks.toFixed(2),
    grade,
  });

  return { finalMarks, grade, weightages };
}
```

---

# PART 3: GPA & PERCENTAGE CALCULATIONS

## Multiple Calculation Methods

```typescript
// GPA Calculation (4-point scale)
export function calculateGPA(
  grades: { grade: string; credits: number; gradePoints: Record<string, number> }[]
): number {
  let totalPoints = 0;
  let totalCredits = 0;

  grades.forEach(({ grade, credits, gradePoints }) => {
    const points = gradePoints[grade] || 0;
    totalPoints += points * credits;
    totalCredits += credits;
  });

  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}

// Percentage Calculation
export function calculatePercentage(
  obtainedMarks: number,
  totalMarks: number
): number {
  if (totalMarks === 0) throw new Error('Total marks cannot be zero');
  return (obtainedMarks / totalMarks) * 100;
}

// Merit Position Calculation
export async function calculateMeritPosition(
  schoolId: string,
  classId: string,
  sectionId: string,
  term: string
): Promise<Map<string, number>> {
  // Get all students' marks
  const grades = await firestore
    .collection('grades')
    .where('schoolId', '==', schoolId)
    .where('classId', '==', classId)
    .where('sectionId', '==', sectionId)
    .where('term', '==', term)
    .get();

  // Calculate total marks per student
  const studentTotals = new Map<string, number>();
  grades.docs.forEach((doc) => {
    const { studentId, obtainedMarks } = doc.data();
    const current = studentTotals.get(studentId) || 0;
    studentTotals.set(studentId, current + obtainedMarks);
  });

  // Sort and assign positions
  const sorted = Array.from(studentTotals.entries())
    .sort((a, b) => b[1] - a[1]);

  const positions = new Map<string, number>();
  sorted.forEach(([studentId], index) => {
    positions.set(studentId, index + 1);
  });

  return positions;
}
```

---

# PART 4: ATTENDANCE RULES

## Attendance Calculation & Eligibility

```typescript
// Calculate attendance percentage
export async function calculateAttendancePercentage(
  schoolId: string,
  studentId: string,
  fromDate: Date,
  toDate: Date
): Promise<{ present: number; absent: number; leave: number; percentage: number }> {
  const records = await firestore
    .collection('attendance')
    .where('schoolId', '==', schoolId)
    .where('studentId', '==', studentId)
    .where('date', '>=', fromDate)
    .where('date', '<=', toDate)
    .get();

  let present = 0;
  let absent = 0;
  let leave = 0;

  records.docs.forEach((doc) => {
    const { status } = doc.data();
    if (status === 'present') present++;
    else if (status === 'absent') absent++;
    else if (status === 'leave') leave++;
  });

  const total = present + absent + leave;
  const percentage = total > 0 ? (present / total) * 100 : 0;

  return { present, absent, leave, percentage };
}

// Check exam eligibility based on attendance
export async function checkExamEligibility(
  schoolId: string,
  studentId: string,
  examId: string,
  term: string
): Promise<{
  isEligible: boolean;
  reason: string;
  attendancePercentage: number;
}> {
  // Get school policy
  const policy = await firestore
    .collection('schools')
    .doc(schoolId)
    .collection('config')
    .doc('eligibility')
    .get();

  const minimumAttendance = policy.data()?.minimumAttendancePercentage || 75;

  // Get term dates
  const termDoc = await firestore
    .collection('schools')
    .doc(schoolId)
    .collection('terms')
    .where('termId', '==', term)
    .get();

  const { startDate, endDate } = termDoc.docs[0].data();

  // Calculate attendance
  const { percentage } = await calculateAttendancePercentage(
    schoolId,
    studentId,
    startDate,
    endDate
  );

  const isEligible = percentage >= minimumAttendance;
  const reason = isEligible 
    ? `Attendance: ${percentage.toFixed(1)}% (≥ ${minimumAttendance}%)`
    : `Attendance: ${percentage.toFixed(1)}% (< ${minimumAttendance}% required)`;

  return { isEligible, reason, attendancePercentage: percentage };
}
```

---

# PART 5: PROMOTION & DEMOTION RULES

## Class Promotion Logic

```typescript
export interface PromotionRules {
  minimumGradeForPromotion: string; // 'E2', 'D', 'C', etc.
  minimumAttendancePercentage: number;
  failedSubjectsAllowed: number;
  cgpaThreshold?: number;
}

export async function checkForPromotion(
  schoolId: string,
  studentId: string,
  currentClass: number,
  term: 'term1' | 'term2' | 'annual'
): Promise<{
  promotionEligible: boolean;
  failedSubjects: string[];
  reasons: string[];
}> {
  // Get promotion rules
  const policy = await firestore
    .collection('schools')
    .doc(schoolId)
    .collection('config')
    .doc('promotion')
    .get();

  const rules: PromotionRules = policy.data() || {
    minimumGradeForPromotion: 'E2',
    minimumAttendancePercentage: 75,
    failedSubjectsAllowed: 2,
  };

  const reasons: string[] = [];
  const failedSubjects: string[] = [];

  // Check 1: Get student's grades
  const grades = await firestore
    .collection('grades')
    .where('schoolId', '==', schoolId)
    .where('studentId', '==', studentId)
    .where('term', '==', term)
    .get();

  const gradeMap = GRADING_SCALES.CBSE_10_POINT.grades;
  const minGradeIndex = gradeMap.findIndex(
    (g) => g.grade === rules.minimumGradeForPromotion
  );

  grades.docs.forEach((doc) => {
    const { subject, grade } = doc.data();
    const gradeIndex = gradeMap.findIndex((g) => g.grade === grade);
    
    if (gradeIndex > minGradeIndex) {
      failedSubjects.push(subject);
    }
  });

  if (failedSubjects.length > rules.failedSubjectsAllowed) {
    reasons.push(
      `Failed in ${failedSubjects.length} subjects (max allowed: ${rules.failedSubjectsAllowed})`
    );
  }

  // Check 2: Attendance
  const { percentage } = await calculateAttendancePercentage(
    schoolId,
    studentId,
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    new Date()
  );

  if (percentage < rules.minimumAttendancePercentage) {
    reasons.push(
      `Attendance ${percentage.toFixed(1)}% (minimum: ${rules.minimumAttendancePercentage}%)`
    );
  }

  // Check 3: Any disciplinary issues?
  const disciplineRecords = await firestore
    .collection('discipline')
    .where('schoolId', '==', schoolId)
    .where('studentId', '==', studentId)
    .where('year', '==', new Date().getFullYear())
    .get();

  if (!disciplineRecords.empty) {
    const severityMax = Math.max(
      ...disciplineRecords.docs.map((d) => d.data().severity || 0)
    );
    if (severityMax >= 3) {
      // Severe disciplinary issues
      reasons.push('Disciplinary issues on record');
    }
  }

  const promotionEligible = reasons.length === 0;

  Logger.info(`Promotion check completed`, {
    schoolId,
    studentId,
    currentClass,
    promotionEligible,
    failedCount: failedSubjects.length,
  });

  return {
    promotionEligible,
    failedSubjects,
    reasons,
  };
}
```

## Bulk Promotion (End-of-Year)

```typescript
export async function bulkPromoteClass(
  schoolId: string,
  classId: string,
  sectionId: string,
  promotionYear: number
): Promise<{
  promoted: number;
  notPromoted: number;
  results: PromotionResult[];
}> {
  // Get all students in class
  const students = await firestore
    .collection('students')
    .where('schoolId', '==', schoolId)
    .where('classId', '==', classId)
    .where('sectionId', '==', sectionId)
    .where('status', '==', 'active')
    .get();

  const results: PromotionResult[] = [];
  let promoted = 0;
  let notPromoted = 0;

  // Check promotion for each student
  for (const studentDoc of students.docs) {
    const { studentId, currentClass } = studentDoc.data();
    const { promotionEligible, reasons } = await checkForPromotion(
      schoolId,
      studentId,
      currentClass,
      'annual'
    );

    if (promotionEligible) {
      // Update student's class
      await firestore.collection('students').doc(studentDoc.id).update({
        class: currentClass + 1,
        promotedAt: new Date(),
      });

      results.push({
        studentId,
        promoted: true,
        newClass: currentClass + 1,
      });
      promoted++;
    } else {
      // Student held back
      results.push({
        studentId,
        promoted: false,
        reasons,
      });
      notPromoted++;
    }
  }

  Logger.info(`Bulk promotion completed`, {
    schoolId,
    classId,
    sectionId,
    promoted,
    notPromoted,
  });

  return { promoted, notPromoted, results };
}
```

---

# PART 6: REPORT CARD GENERATION

## Multi-Format Report Card

```typescript
export async function generateReportCard(
  schoolId: string,
  studentId: string,
  term: 'term1' | 'term2' | 'annual'
): Promise<ReportCard> {
  // Fetch student info
  const student = await firestore.collection('students').doc(studentId).get();

  // Fetch grades
  const grades = await firestore
    .collection('grades')
    .where('schoolId', '==', schoolId)
    .where('studentId', '==', studentId)
    .where('term', '==', term)
    .get();

  // Calculate statistics
  const { percentage } = await calculateAttendancePercentage(...);
  const meritPosition = await calculateMeritPosition(...);

  // Check promotion
  const { promotionEligible } = await checkForPromotion(...);

  // Generate report
  const reportCard: ReportCard = {
    schoolId,
    studentId,
    term,
    student: student.data(),
    subjects: grades.docs.map((doc) => ({
      subjectId: doc.data().subjectId,
      subjectName: doc.data().subjectName,
      marks: doc.data().obtainedMarks,
      totalMarks: doc.data().totalMarks,
      grade: doc.data().grade,
      teacherRemarks: doc.data().remarks,
    })),
    attendance: percentage,
    meritPosition: meritPosition.get(studentId) || 0,
    principalRemarks: 'Good progress',
    promotionStatus: promotionEligible ? 'promoted' : 'held_back',
    generatedAt: new Date(),
  };

  Logger.info(`Report card generated`, {
    schoolId,
    studentId,
    term,
  });

  return reportCard;
}
```

---

# PART 7: FEE & FINANCIAL RULES

## Fee Calculation & Reminders

```typescript
export interface FeeStructure {
  classWiseFee: Record<number, number>;
  transportFee?: number;
  uniformFee?: number;
  activityFee?: number;
  dueDate: Date;
  lateFeesAfterDays: number;
  lateFeePercentage: number;
}

export async function calculateFeesDue(
  schoolId: string,
  studentId: string,
  month: Date
): Promise<{
  baseFee: number;
  lateFee: number;
  totalDue: number;
  dueDate: Date;
}> {
  // Get student's class
  const student = await firestore.collection('students').doc(studentId).get();
  const studentClass = student.data()?.class;

  // Get fee structure
  const feePolicy = await firestore
    .collection('schools')
    .doc(schoolId)
    .collection('config')
    .doc('fees')
    .get();

  const structure: FeeStructure = feePolicy.data() || {};
  const baseFee = structure.classWiseFee[studentClass] || 0;

  // Check if overdue
  const daysOverdue = Math.floor(
    (new Date().getTime() - structure.dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let lateFee = 0;
  if (daysOverdue > structure.lateFeesAfterDays) {
    lateFee = (baseFee * structure.lateFeePercentage) / 100;
  }

  return {
    baseFee,
    lateFee,
    totalDue: baseFee + lateFee,
    dueDate: structure.dueDate,
  };
}
```

---

# PART 8: RULE MANAGEMENT UI

## Admin Configuration

```
Rules Configuration Panel
├─ Grading System ✏️
│  ├─ Scale: CBSE / 5-Point / Custom
│  ├─ Weightages: Assessment (10%), Periodical (20%), Final (50%)
│  └─ Subject-wise overrides (optional)
│
├─ Promotion Rules ✏️
│  ├─ Minimum grade for promotion: E2 / D / C
│  ├─ Minimum attendance: 75%
│  └─ Failed subjects allowed: 2
│
├─ Attendance Rules ✏️
│  ├─ Minimum for exam eligibility: 75%
│  ├─ Leave policy: Casual / Medical / Authorized
│  └─ Parent notifications: After 5 absences
│
├─ Fee Rules ✏️
│  ├─ Class-wise fee: Class V: ₹5000, Class VI: ₹6000
│  ├─ Due date: 5th of every month
│  └─ Late fee: 5% after 10 days
│
└─ Save & Apply
```

---

**The Business Rules Engine makes your ERP adaptive to any Indian school's academic policies and practices.**
