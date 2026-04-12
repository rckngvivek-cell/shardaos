// SMS Service - Twilio Integration

import { SMSStatus, SMSAuditRecord, SMSSendResponse, SMSTemplateType, SMSConfig } from './types';
import SMSTemplateEngine from './template-engine';
import { db } from '../../lib/firestore';
import { v4 as uuidv4 } from 'uuid';

interface SMSSendOptions {
  schoolId: string;
  recipients: string[];
  templateId: SMSTemplateType;
  variables: Record<string, any>;
  sendAt?: string;
}

export class SMSService {
  private config: SMSConfig;
  private rateLimitMap: Map<string, number> = new Map(); // For in-memory rate limiting

  constructor(config: SMSConfig) {
    this.config = config;
  }

  /**
   * Send SMS to recipients
   */
  async sendSMS(options: SMSSendOptions): Promise<SMSSendResponse> {
    const { schoolId, recipients, templateId, variables, sendAt } = options;
    const sessionId = uuidv4();

    // Validate template
    const validation = SMSTemplateEngine.validateVariables(templateId, variables);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // Render message
    const renderResult = SMSTemplateEngine.render(templateId, variables);
    if (!renderResult.success) {
      throw new Error(`Template rendering failed: ${renderResult.error}`);
    }

    const message = renderResult.message!;
    const smsCount = SMSTemplateEngine.estimateSMSCount(message);
    const details: SMSSendResponse['details'] = [];
    let successful = 0;
    let failed = 0;
    let totalCost = 0;

    // Send to each recipient
    for (const recipient of recipients) {
      try {
        // Check rate limit
        if (!this.checkRateLimit(recipient)) {
          details.push({
            recipient,
            status: SMSStatus.FAILED,
            error: 'Rate limit exceeded',
          });
          failed++;
          continue;
        }

        // In production: Call Twilio API here
        // For now: Mock successful send
        const externalId = `SM${uuidv4().replace(/-/g, '').substring(0, 30)}`;
        const cost = this.config.costPerSMS * smsCount;

        // Record audit trail
        await this.logSMSAudit({
          id: uuidv4(),
          schoolId,
          type: 'sms',
          templateId,
          recipient,
          message,
          status: SMSStatus.DELIVERED,
          sentAt: new Date(),
          deliveredAt: new Date(Date.now() + 1000), // 1 sec delay
          cost,
          externalId,
          retryCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        details.push({
          recipient,
          status: SMSStatus.DELIVERED,
          externalId,
        });

        successful++;
        totalCost += cost;

      } catch (error) {
        details.push({
          recipient,
          status: SMSStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return {
      messageId: sessionId,
      sessionId,
      status: failed === 0 ? SMSStatus.SENT : SMSStatus.FAILED,
      recipients: recipients.length,
      successful,
      failed,
      totalCost,
      estimatedDelivery: '10 seconds',
      details,
    };
  }

  /**
   * Log SMS to audit trail
   */
  private async logSMSAudit(record: SMSAuditRecord): Promise<void> {
    try {
      await db
        .collection('schools')
        .doc(record.schoolId)
        .collection('sms-audit')
        .doc(record.id)
        .set({
          ...record,
          sentAt: record.sentAt.toISOString(),
          deliveredAt: record.deliveredAt?.toISOString(),
          failedAt: record.failedAt?.toISOString(),
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        });
    } catch (error) {
      console.error('Failed to log SMS audit:', error);
    }
  }

  /**
   * Check rate limit for recipient
   */
  private checkRateLimit(recipient: string): boolean {
    const now = Date.now();
    const key = recipient;
    const lastSent = this.rateLimitMap.get(key) || 0;
    const timeSinceLastSMS = now - lastSent;
    const minIntervalMs = (3600 / this.config.rateLimitPerPhone) * 1000; // Spread evenly

    if (timeSinceLastSMS < minIntervalMs) {
      return false;
    }

    this.rateLimitMap.set(key, now);
    return true;
  }

  /**
   * Get SMS history for school
   */
  async getSMSHistory(
    schoolId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<SMSAuditRecord[]> {
    const { limit = 50, offset = 0 } = options || {};

    try {
      const snapshot = await db
        .collection('schools')
        .doc(schoolId)
        .collection('sms-audit')
        .orderBy('sentAt', 'desc')
        .limit(limit + offset)
        .get();

      const docs = snapshot.docs.slice(offset);
      return docs.map((doc: any) => ({
        ...(doc.data() as any),
        sentAt: new Date(doc.data().sentAt),
        deliveredAt: doc.data().deliveredAt ? new Date(doc.data().deliveredAt) : undefined,
        failedAt: doc.data().failedAt ? new Date(doc.data().failedAt) : undefined,
        createdAt: new Date(doc.data().createdAt),
        updatedAt: new Date(doc.data().updatedAt),
      }));
    } catch (error) {
      console.error('Failed to fetch SMS history:', error);
      return [];
    }
  }

  /**
   * Get SMS statistics for school
   */
  async getSMSStats(schoolId: string): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalCost: number;
    averageCostPerSMS: number;
  }> {
    try {
      const snapshot = await db
        .collection('schools')
        .doc(schoolId)
        .collection('sms-audit')
        .get();

      let totalCost = 0;
      let totalDelivered = 0;
      let totalFailed = 0;

      snapshot.forEach((doc: any) => {
        const data = doc.data();
        totalCost += data.cost || 0;
        if (data.status === SMSStatus.DELIVERED) totalDelivered++;
        if (data.status === SMSStatus.FAILED) totalFailed++;
      });

      const totalSent = totalDelivered + totalFailed;
      const averageCostPerSMS = totalSent > 0 ? totalCost / totalSent : 0;

      return {
        totalSent,
        totalDelivered,
        totalFailed,
        totalCost,
        averageCostPerSMS,
      };
    } catch (error) {
      console.error('Failed to fetch SMS stats:', error);
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        totalCost: 0,
        averageCostPerSMS: 0,
      };
    }
  }
}

export default SMSService;
