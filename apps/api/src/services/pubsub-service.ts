/**
 * PubSub Service for Exam Module Data Pipeline
 * 
 * Publishes exam events to Google Cloud Pub/Sub for real-time data warehouse
 * integration with BigQuery via Dataflow pipelines.
 * 
 * Topics:
 * - exam-submissions-topic: exam creation and submissions
 * - exam-results-topic: exam results and grading
 */

import { PubSub, PublishOptions } from '@google-cloud/pubsub';
import { Logger } from './logger';

interface PubSubMessage {
  eventType: string;
  timestamp: string;
  data: Record<string, any>;
  metadata: {
    environment: string;
    version: string;
    source: string;
    requestId?: string;
  };
}

export class PubSubService {
  private pubSub: PubSub | null;
  private topicsCache: Map<string, any> = new Map();
  private readonly logger: Logger;
  private isEnabled: boolean = false;

  // Topic names
  static readonly EXAM_SUBMISSIONS_TOPIC = 'exam-submissions-topic';
  static readonly EXAM_RESULTS_TOPIC = 'exam-results-topic';

  constructor(projectId?: string, enablePubSub: boolean = true) {
    this.logger = new Logger('PubSubService');
    this.isEnabled = enablePubSub;
    
    if (enablePubSub) {
      try {
        this.pubSub = new PubSub({
          projectId: projectId || process.env.GCP_PROJECT_ID || 'school-erp-dev',
        });
      } catch (error) {
        this.logger.warn('Failed to initialize PubSub client - operating in disabled mode');
        this.pubSub = null;
        this.isEnabled = false;
      }
    } else {
      this.pubSub = null;
    }
  }

  /**
   * Initialize required topics (create if they don't exist)
   */
  async initializeTopics(): Promise<void> {
    if (!this.isEnabled || !this.pubSub) {
      this.logger.info('PubSub topics initialization skipped (PubSub disabled or unavailable)');
      return;
    }

    try {
      await this.ensureTopicExists(PubSubService.EXAM_SUBMISSIONS_TOPIC);
      await this.ensureTopicExists(PubSubService.EXAM_RESULTS_TOPIC);
      this.logger.info('PubSub topics initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PubSub topics', error);
      // Continue without throwing - PubSub is optional
    }
  }

  /**
   * Ensure a topic exists, create if necessary
   */
  private async ensureTopicExists(topicName: string): Promise<void> {
    if (!this.pubSub) {
      this.logger.warn(`Cannot ensure topic exists: PubSub not initialized`);
      return;
    }

    try {
      const topic = this.pubSub.topic(topicName);
      const [exists] = await topic.exists();

      if (!exists) {
        this.logger.info(`Creating topic: ${topicName}`);
        const [newTopic] = await this.pubSub.createTopic(topicName);
        this.topicsCache.set(topicName, newTopic);
        this.logger.info(`Topic created: ${topicName}`);
      } else {
        this.topicsCache.set(topicName, topic);
        this.logger.debug(`Topic already exists: ${topicName}`);
      }
    } catch (error) {
      this.logger.error(`Error ensuring topic exists: ${topicName}`, error);
      throw error;
    }
  }

  /**
   * Publish an exam creation event
   */
  async publishExamCreated(examData: {
    id: string;
    schoolId: string;
    title: string;
    subject?: string;
    totalMarks: number;
    createdAt: string;
    status: string;
  }, requestId?: string): Promise<string> {
    return this.publishMessage(PubSubService.EXAM_SUBMISSIONS_TOPIC, {
      eventType: 'EXAM_CREATED',
      timestamp: new Date().toISOString(),
      data: {
        examId: examData.id,
        schoolId: examData.schoolId,
        title: examData.title,
        subject: examData.subject,
        totalMarks: examData.totalMarks,
        createdAt: examData.createdAt,
        status: examData.status,
      },
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '0.1.0',
        source: 'school-erp-api',
        requestId,
      },
    });
  }

  /**
   * Publish an exam submission event
   */
  async publishExamSubmitted(submissionData: {
    id: string;
    examId: string;
    schoolId: string;
    studentId: string;
    submittedAt: string;
    answerCount: number;
  }, requestId?: string): Promise<string> {
    return this.publishMessage(PubSubService.EXAM_SUBMISSIONS_TOPIC, {
      eventType: 'EXAM_SUBMITTED',
      timestamp: new Date().toISOString(),
      data: {
        submissionId: submissionData.id,
        examId: submissionData.examId,
        schoolId: submissionData.schoolId,
        studentId: submissionData.studentId,
        submittedAt: submissionData.submittedAt,
        answerCount: submissionData.answerCount,
      },
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '0.1.0',
        source: 'school-erp-api',
        requestId,
      },
    });
  }

  /**
   * Publish an exam result/grading event
   */
  async publishExamGraded(resultData: {
    id: string;
    examId: string;
    schoolId: string;
    studentId: string;
    score: number;
    totalMarks: number;
    percentage: number;
    grade: string;
    gradedAt: string;
    status: string;
  }, requestId?: string): Promise<string> {
    return this.publishMessage(PubSubService.EXAM_RESULTS_TOPIC, {
      eventType: 'EXAM_GRADED',
      timestamp: new Date().toISOString(),
      data: {
        resultId: resultData.id,
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
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '0.1.0',
        source: 'school-erp-api',
        requestId,
      },
    });
  }

  /**
   * Generic message publishing
   */
  private async publishMessage(
    topicName: string,
    message: PubSubMessage
  ): Promise<string> {
    if (!this.isEnabled || !this.pubSub) {
      this.logger.debug(`PubSub disabled - skipping message to ${topicName}`, {
        eventType: message.eventType,
      });
      return 'mock-message-id'; // Return mock ID for disabled mode
    }

    try {
      const topic = this.pubSub.topic(topicName);
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const messageId = await topic.publish(messageBuffer);
      
      this.logger.info(`Message published to ${topicName}`, {
        messageId,
        eventType: message.eventType,
      });

      return messageId;
    } catch (error) {
      this.logger.error(`Failed to publish message to ${topicName}`, error);
      // Don't throw - publishing failures should not break API functionality
      // but should be logged for debugging
      return '';
    }
  }

  /**
   * Get topic statistics for monitoring
   */
  async getTopicStats(topicName: string): Promise<{
    topicName: string;
    subscriptionCount: number;
  }> {
    if (!this.isEnabled || !this.pubSub) {
      return { topicName, subscriptionCount: 0 };
    }
    
    try {
      const topic = this.pubSub.topic(topicName);
      const [metadata] = await topic.getMetadata();
      
      // Count subscriptions
      const subscriptions = await topic.getSubscriptions();
      
      return {
        topicName,
        subscriptionCount: subscriptions[0]?.length || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get topic stats for ${topicName}`, error);
      return { topicName, subscriptionCount: 0 };
    }
  }

  /**
   * Health check - verify topics are accessible
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isEnabled || !this.pubSub) {
      this.logger.debug('PubSub health check: disabled');
      return true; // Return true even if disabled - it's a graceful state
    }
    
    try {
      const [topics] = await this.pubSub.getTopics();
      this.logger.debug(`PubSub health check: ${topics.length} topics available`);
      return true;
    } catch (error) {
      this.logger.error('PubSub health check failed', error);
      return false;
    }
  }

  /**
   * List all available topics
   */
  async listTopics(): Promise<string[]> {
    if (!this.isEnabled || !this.pubSub) {
      return [];
    }

    try {
      const [topics] = await this.pubSub.getTopics();
      return topics.map(t => t.name.split('/').pop() || t.name);
    } catch (error) {
      this.logger.error('Failed to list topics', error);
      return [];
    }
  }
}

// Singleton instance
let pubSubServiceInstance: PubSubService | null = null;

export function getPubSubService(): PubSubService {
  if (!pubSubServiceInstance) {
    pubSubServiceInstance = new PubSubService();
  }
  return pubSubServiceInstance;
}

/**
 * Initialize PubSub service on app startup
 */
export async function initializePubSub(): Promise<void> {
  try {
    const service = getPubSubService();
    await service.initializeTopics();
    console.log('[PubSub] Service initialized successfully');
  } catch (error) {
    console.error('[PubSub] Failed to initialize service', error);
    // Don't crash the app if PubSub init fails (optional dependency)
    // but log it prominently
  }
}
