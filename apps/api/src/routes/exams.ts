import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../lib/firebase';
import { HttpError } from '../lib/http-error';
import { getPubSubService } from '../services/pubsub-service';
import { getCloudLoggingService } from '../services/cloud-logging';

export interface CreateExamRequest {
  schoolId: string;
  title: string;
  subject: string;
  totalMarks: number;
  durationMinutes: number;
  classId: string;
  startTime: string;
  endTime: string;
}

export interface Exam {
  id: string;
  schoolId: string;
  title: string;
  subject: string;
  totalMarks: number;
  durationMinutes: number;
  classId: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'scheduled' | 'ongoing' | 'completed';
}

export function createExamsRouter() {
  const router = Router();
  const pubSub = getPubSubService();
  const logger = getCloudLoggingService();

  // POST /api/v1/exams - Create exam
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const requestId = uuidv4();
    try {
      const body = req.body as CreateExamRequest;

      // Validation
      if (!body.schoolId || !body.title || body.totalMarks === undefined) {
        throw new HttpError(400, 'INVALID_EXAM', 'Missing required fields: schoolId, title, totalMarks');
      }

      const examId = uuidv4();
      const now = new Date().toISOString();

      const examData: Exam = {
        id: examId,
        schoolId: body.schoolId,
        title: body.title,
        subject: body.subject,
        totalMarks: body.totalMarks,
        durationMinutes: body.durationMinutes,
        classId: body.classId,
        startTime: body.startTime,
        endTime: body.endTime,
        createdAt: now,
        updatedAt: now,
        status: 'draft'
      };

      // Write to Firestore
      await getDb().collection('schools').doc(body.schoolId)
        .collection('exams').doc(examId)
        .set(examData);

      // Publish to Pub/Sub for data pipeline
      const messageId = await pubSub.publishExamCreated(
        {
          id: examData.id,
          schoolId: examData.schoolId,
          title: examData.title,
          subject: examData.subject,
          totalMarks: examData.totalMarks,
          createdAt: examData.createdAt,
          status: examData.status,
        },
        requestId
      );

      await logger.logPubSubEvent('exam-submissions-topic', 'EXAM_CREATED', messageId, {
        examId,
        schoolId: body.schoolId,
      });

      res.status(201).json({
        success: true,
        data: examData,
        _metadata: {
          requestId,
          pubsubMessageId: messageId,
        }
      });
    } catch (error) {
      await logger.error('Failed to create exam', error as Error, { requestId });
      next(error);
    }
  });

  // GET /api/v1/exams - List exams
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { schoolId } = req.query;

      if (!schoolId || typeof schoolId !== 'string') {
        throw new HttpError(400, 'INVALID_SCHOOL_ID', 'schoolId query parameter is required');
      }

      const snapshot = await getDb().collection('schools').doc(schoolId)
        .collection('exams')
        .orderBy('createdAt', 'desc')
        .get();

      const exams = snapshot.docs.map(doc => doc.data() as Exam);

      res.status(200).json({
        success: true,
        data: exams,
        count: exams.length
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
