import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../lib/firebase';
import { HttpError } from '../lib/http-error';
import { getPubSubService } from '../services/pubsub-service';
import { getCloudLoggingService } from '../services/cloud-logging';

export interface ExamResult {
  id: string;
  schoolId: string;
  examId: string;
  studentId: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  submittedAt: string;
  gradedAt: string;
  status: 'graded' | 'pending';
}

export function createResultsRouter() {
  const router = Router();
  const pubSub = getPubSubService();
  const logger = getCloudLoggingService();

  // POST /api/v1/results - Create result (for grading)
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const requestId = uuidv4();
    try {
      const body = req.body as Omit<ExamResult, 'id'>;

      if (!body.schoolId || !body.examId || !body.studentId) {
        throw new HttpError(400, 'INVALID_RESULT', 'Missing required fields: schoolId, examId, studentId');
      }

      const resultId = uuidv4();

      const resultData: ExamResult = {
        ...body,
        id: resultId,
        status: 'graded'
      };

      // Write to Firestore
      await getDb().collection('schools').doc(body.schoolId)
        .collection('exam_results').doc(resultId)
        .set(resultData);

      // Publish to Pub/Sub for data pipeline
      const messageId = await pubSub.publishExamGraded(
        {
          id: resultData.id,
          examId: resultData.examId,
          schoolId: resultData.schoolId,
          studentId: resultData.studentId,
          score: resultData.score,
          totalMarks: resultData.totalMarks,
          percentage: resultData.percentage,
          grade: resultData.grade,
          gradedAt: resultData.gradedAt,
          status: resultData.status,
        },
        requestId
      );

      await logger.logPubSubEvent('exam-results-topic', 'EXAM_GRADED', messageId, {
        resultId,
        examId: body.examId,
        schoolId: body.schoolId,
      });

      res.status(201).json({
        success: true,
        data: resultData,
        _metadata: {
          requestId,
          pubsubMessageId: messageId,
        }
      });
    } catch (error) {
      await logger.error('Failed to create result', error as Error, { requestId });
      next(error);
    }
  });

  // GET /api/v1/results - Fetch exam results
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { schoolId, examId, studentId } = req.query;

      if (!schoolId || typeof schoolId !== 'string') {
        throw new HttpError(400, 'INVALID_SCHOOL_ID', 'schoolId is required');
      }

      let query: any = getDb().collection('schools').doc(schoolId)
        .collection('exam_results');

      if (examId && typeof examId === 'string') {
        query = query.where('examId', '==', examId);
      }

      if (studentId && typeof studentId === 'string') {
        query = query.where('studentId', '==', studentId);
      }

      const snapshot = await query.orderBy('gradedAt', 'desc').get();
      const results = snapshot.docs.map((doc: any) => doc.data() as ExamResult);

      res.status(200).json({
        success: true,
        data: results,
        count: results.length
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
