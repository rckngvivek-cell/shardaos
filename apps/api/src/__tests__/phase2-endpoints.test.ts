import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { createExamsRouter, type Exam } from '../routes/exams';
import { createSubmissionsRouter, type ExamSubmission } from '../routes/submissions';
import { createResultsRouter, type ExamResult } from '../routes/results';

// Mock Firebase/Firestore
vi.mock('../lib/firebase', () => ({
  getDb: vi.fn(() => ({
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    set: vi.fn().mockResolvedValue({}),
    get: vi.fn().mockResolvedValue({ docs: [] }),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis()
  }))
}));

describe('Phase 2 Exam Endpoints', () => {
  let mockExamData: Partial<Exam>;

  beforeEach(() => {
    mockExamData = {
      schoolId: 'school-123',
      title: 'Mathematics Final Exam',
      subject: 'Mathematics',
      totalMarks: 100,
      durationMinutes: 120,
      classId: 'class-10a',
      startTime: new Date('2026-04-20T10:00:00Z').toISOString(),
      endTime: new Date('2026-04-20T12:00:00Z').toISOString()
    };
  });

  describe('POST /api/v1/exams - Create Exam', () => {
    it('should create an exam with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/exams')
        .send(mockExamData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe(mockExamData.title);
    });

    it('should return 400 error without schoolId', async () => {
      const { schoolId, ...invalidData } = mockExamData;
      
      const response = await request(app)
        .post('/api/v1/exams')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 error without title', async () => {
      const { title, ...invalidData } = mockExamData;
      
      const response = await request(app)
        .post('/api/v1/exams')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 error without totalMarks', async () => {
      const { totalMarks, ...invalidData } = mockExamData;
      
      const response = await request(app)
        .post('/api/v1/exams')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/exams - List Exams', () => {
    it('should list exams for a school', async () => {
      const response = await request(app)
        .get('/api/v1/exams')
        .query({ schoolId: 'school-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBe(0); // Mock returns empty array
    });

    it('should return 400 without schoolId query', async () => {
      const response = await request(app)
        .get('/api/v1/exams')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Phase 2 Submission Endpoints', () => {
  let mockSubmissionData: Partial<ExamSubmission>;

  beforeEach(() => {
    mockSubmissionData = {
      schoolId: 'school-123',
      examId: 'exam-456',
      studentId: 'student-789',
      answers: [
        { questionId: 'q1', answer: 'Option A' },
        { questionId: 'q2', answer: 'Option B' }
      ],
      submittedAt: new Date().toISOString()
    };
  });

  describe('POST /api/v1/submissions - Submit Exam', () => {
    it('should submit an exam with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/submissions')
        .send(mockSubmissionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.studentId).toBe(mockSubmissionData.studentId);
    });

    it('should return 400 without examId', async () => {
      const { examId, ...invalidData } = mockSubmissionData;
      
      const response = await request(app)
        .post('/api/v1/submissions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 without studentId', async () => {
      const { studentId, ...invalidData } = mockSubmissionData;
      
      const response = await request(app)
        .post('/api/v1/submissions')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/submissions - List Submissions', () => {
    it('should list submissions for a school', async () => {
      const response = await request(app)
        .get('/api/v1/submissions')
        .query({ schoolId: 'school-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter by examId if provided', async () => {
      await request(app)
        .get('/api/v1/submissions')
        .query({ schoolId: 'school-123', examId: 'exam-456' })
        .expect(200);
    });

    it('should filter by studentId if provided', async () => {
      await request(app)
        .get('/api/v1/submissions')
        .query({ schoolId: 'school-123', studentId: 'student-789' })
        .expect(200);
    });
  });
});

describe('Phase 2 Results Endpoints', () => {
  let mockResultData: Partial<ExamResult>;

  beforeEach(() => {
    mockResultData = {
      schoolId: 'school-123',
      examId: 'exam-456',
      studentId: 'student-789',
      score: 85,
      totalMarks: 100,
      percentage: 85,
      grade: 'A',
      submittedAt: new Date('2026-04-20T11:30:00Z').toISOString(),
      gradedAt: new Date('2026-04-20T12:00:00Z').toISOString()
    };
  });

  describe('POST /api/v1/results - Create Result', () => {
    it('should create a result with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/results')
        .send(mockResultData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.score).toBe(mockResultData.score);
    });

    it('should return 400 without studentId', async () => {
      const { studentId, ...invalidData } = mockResultData;
      
      const response = await request(app)
        .post('/api/v1/results')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/results - Fetch Results', () => {
    it('should fetch results for a school', async () => {
      const response = await request(app)
        .get('/api/v1/results')
        .query({ schoolId: 'school-123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter by examId if provided', async () => {
      await request(app)
        .get('/api/v1/results')
        .query({ schoolId: 'school-123', examId: 'exam-456' })
        .expect(200);
    });

    it('should filter by studentId if provided', async () => {
      await request(app)
        .get('/api/v1/results')
        .query({ schoolId: 'school-123', studentId: 'student-789' })
        .expect(200);
    });
  });
});
