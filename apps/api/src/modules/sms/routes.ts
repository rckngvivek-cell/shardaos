// SMS Routes

import express, { Router, Request, Response } from 'express';
import { SMSSendRequestSchema } from './types';
import SMSService from './sms-service';
import { SMSConfig } from './types';

const router = Router();

// Initialize SMS service with config
const smsConfig: SMSConfig = {
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '+911234567890',
  costPerSMS: 0.47, // Bulk rate in rupees
  rateLimitPerPhone: 5, // SMS per hour
  rateLimitPerSchool: 1000, // SMS per hour
  maxRetries: 3,
  requestTimeout: 10000,
};

const smsService = new SMSService(smsConfig);

/**
 * POST /api/v1/schools/:schoolId/sms/send
 * Send SMS via template
 */
router.post(
  '/:schoolId/sms/send',
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
      const { recipients, templateId, variables, sendAt } = req.body;

      // Validate input
      const validation = SMSSendRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request body',
          details: validation.error.errors,
        });
      }

      if (recipients.length === 0) {
        return res.status(400).json({
          error: 'At least one recipient is required',
        });
      }

      if (recipients.length > 1000) {
        return res.status(400).json({
          error: 'Maximum 1000 recipients per request',
        });
      }

      // Send SMS
      const response = await smsService.sendSMS({
        schoolId,
        recipients,
        templateId,
        variables,
        sendAt,
      });

      res.status(201).json(response);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('SMS send error:', error);
      
      res.status(500).json({
        error: 'Failed to send SMS',
        message,
      });
    }
  }
);

/**
 * GET /api/v1/schools/:schoolId/sms/history
 * Get SMS history
 */
router.get(
  '/:schoolId/sms/history',
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;
      const limitVal = Array.isArray(req.query.limit) ? (req.query.limit[0] as string) : (req.query.limit as string) ?? '50';
      const offsetVal = Array.isArray(req.query.offset) ? (req.query.offset[0] as string) : (req.query.offset as string) ?? '0';

      const history = await smsService.getSMSHistory(schoolId, {
        limit: Math.min(parseInt(limitVal), 100),
        offset: parseInt(offsetVal),
      });

      res.status(200).json({
        schoolId,
        count: history.length,
        records: history,
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch SMS history',
      });
    }
  }
);

/**
 * GET /api/v1/schools/:schoolId/sms/stats
 * Get SMS statistics
 */
router.get(
  '/:schoolId/sms/stats',
  async (req: any, res: Response) => {
    try {
      const schoolId = Array.isArray(req.params.schoolId) ? req.params.schoolId[0] : req.params.schoolId;

      const stats = await smsService.getSMSStats(schoolId);

      res.status(200).json({
        schoolId,
        ...stats,
      });

    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch SMS statistics',
      });
    }
  }
);

export default router;
