import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../lib/firebase';
import { HttpError } from '../lib/http-error';
import { getPubSubService } from '../services/pubsub-service';
import { getCloudLoggingService } from '../services/cloud-logging';

export interface SubmitExamRequest {
  schoolId: string;
  examId: string;
  studentId: string;
  answers: { questionId: string; answer: string }[];
  submittedAt: string;
}

export interface ExamSubmission {
  id: string;
  schoolId: string;
  examId: string;
  studentId: string;
  answers: { questionId: string; answer: string }[];
  submittedAt: string;
  createdAt: string;
  score?: number;
  status: 'submitted' | 'graded' | 'resubmitted';
}

export function createSubmissionsRouter() {
  const router = Router();
  const pubSub = getPubSubService();
  const logger = getCloudLoggingService();

  // POST /api/v1/submissions - Submit exam
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const requestId = uuidv4();
    try {
      const body = req.body as SubmitExamRequest;

      if (!body.schoolId || !body.examId || !body.studentId) {
        throw new HttpError(400, 'INVALID_SUBMISSION', 'Missing required fields: schoolId, examId, studentId');
      }

      const submissionId = uuidv4();
      const now = new Date().toISOString();

      const submissionData: ExamSubmission = {
        id: submissionId,
        schoolId: body.schoolId,
        examId: body.examId,
        studentId: body.studentId,
        answers: body.answers,
        submittedAt: body.submittedAt,
        createdAt: now,
        status: 'submitted'
      };

      // Write to Firestore
      await getDb().collection('schools').doc(body.schoolId)
        .collection('exam_submissions').doc(submissionId)
        .set(submissionData);

      // Publish to Pub/Sub for data pipeline
      const messageId = await pubSub.publishExamSubmitted(
        {
          id: submissionData.id,
          examId: submissionData.examId,
          schoolId: submissionData.schoolId,
          studentId: submissionData.studentId,
          submittedAt: submissionData.submittedAt,
          answerCount: submissionData.answers?.length || 0,
        },
        requestId
      );

      await logger.logPubSubEvent('exam-submissions-topic', 'EXAM_SUBMITTED', messageId, {
        submissionId,
        examId: body.examId,
        schoolId: body.schoolId,
      });

      res.status(201).json({
        success: true,
        data: submissionData,
        _metadata: {
          requestId,
          pubsubMessageId: messageId,
        }
      });
    } catch (error) {
      await logger.error('Failed to submit exam', error as Error, { requestId });
      next(error);
    }
  });

  // GET /api/v1/submissions - List submissions
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { schoolId, examId, studentId } = req.query;

      if (!schoolId || typeof schoolId !== 'string') {
        throw new HttpError(400, 'INVALID_SCHOOL_ID', 'schoolId query parameter is required');
      }

      let query: any = getDb().collection('schools').doc(schoolId)
        .collection('exam_submissions');

      if (examId && typeof examId === 'string') {
        query = query.where('examId', '==', examId);
      }

      if (studentId && typeof studentId === 'string') {
        query = query.where('studentId', '==', studentId);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const submissions = snapshot.docs.map((doc: any) => doc.data() as ExamSubmission);

      res.status(200).json({
        success: true,
        data: submissions,
        count: submissions.length
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
