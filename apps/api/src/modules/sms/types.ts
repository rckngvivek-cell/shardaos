// SMS Types & Schemas

import { z } from 'zod';

export enum SMSTemplateType {
  ATTENDANCE = 'ATTENDANCE',
  GRADES = 'GRADES',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  FEE_DUE = 'FEE_DUE',
  HOLIDAY = 'HOLIDAY',
}

export enum SMSStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

// Zod schema for SMS send request
export const SMSSendRequestSchema = z.object({
  recipients: z.array(z.string().regex(/^\d{10}$/)),
  templateId: z.nativeEnum(SMSTemplateType),
  variables: z.record(z.string(), z.any()),
  sendAt: z.string().optional(), // ISO datetime for scheduled send
});

export type SMSSendRequest = z.infer<typeof SMSSendRequestSchema>;

// SMS audit record
export interface SMSAuditRecord {
  id: string;
  schoolId: string;
  type: 'sms';
  templateId: SMSTemplateType;
  recipient: string;
  message: string;
  status: SMSStatus;
  sentAt: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  cost: number; // in rupees
  externalId?: string; // Twilio SID
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// SMS send response
export interface SMSSendResponse {
  messageId: string;
  sessionId: string;
  status: SMSStatus;
  recipients: number;
  successful: number;
  failed: number;
  totalCost: number;
  estimatedDelivery: string;
  details: Array<{
    recipient: string;
    status: SMSStatus;
    externalId?: string;
    error?: string;
  }>;
}

// Template configuration
export interface SMSTemplate {
  id: SMSTemplateType;
  template: string;
  requiredVars: string[];
  maxLength: number;
}

// SMS configuration
export interface SMSConfig {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  costPerSMS: number; // in rupees
  rateLimitPerPhone: number; // max SMS per hour
  rateLimitPerSchool: number; // max SMS per hour
  maxRetries: number;
  requestTimeout: number; // milliseconds
}
