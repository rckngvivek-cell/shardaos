// SMS Tests

import { describe, test, expect, beforeEach } from '@jest/globals';
import SMSTemplateEngine from '../template-engine';
import { SMSTemplateType, SMSStatus } from '../types';
import SMSService from '../sms-service';

describe('SMSTemplateEngine', () => {
  test('should render attendance template correctly', () => {
    const result = SMSTemplateEngine.render(SMSTemplateType.ATTENDANCE, {
      parentName: 'Mr. Sharma',
      studentName: 'Rohan',
      subjects: 'Math, Science',
      schoolName: 'DPS School',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Mr. Sharma');
    expect(result.message).toContain('Rohan');
  });

  test('should render grades template correctly', () => {
    const result = SMSTemplateEngine.render(SMSTemplateType.GRADES, {
      parentName: 'Mrs. Patel',
      studentName: 'Anjali',
      marks: '92',
      subject: 'History',
      schoolName: 'DPS School',
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('92/100');
    expect(result.message).toContain('History');
  });

  test('should reject missing required variables', () => {
    const result = SMSTemplateEngine.render(SMSTemplateType.ATTENDANCE, {
      parentName: 'Mr. Sharma',
      // Missing studentName, subjects, schoolName
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Missing required variables');
  });

  test('should detect message exceeding length limit', () => {
    const longText = 'A'.repeat(200);
    const result = SMSTemplateEngine.render(SMSTemplateType.ANNOUNCEMENT, {
      schoolName: 'DPS School',
      message: longText,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('exceeds max length');
  });

  test('should validate variables against template', () => {
    const validation = SMSTemplateEngine.validateVariables(
      SMSTemplateType.GRADES,
      {
        parentName: 'Mr. Kumar',
        studentName: 'Aman',
        // Missing marks, subject, schoolName
      }
    );

    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('should list all available templates', () => {
    const templates = SMSTemplateEngine.listTemplates();

    expect(templates.length).toBeGreaterThan(0);
    expect(templates.some(t => t.id === SMSTemplateType.ATTENDANCE)).toBe(true);
  });

  test('should estimate SMS count correctly', () => {
    const shortMessage = 'Hello'; // 5 chars = 1 SMS
    const longMessage = 'A'.repeat(160); // 160 chars = 1 SMS
    const twoPartMessage = 'A'.repeat(161); // 161 chars = 2 SMS

    expect(SMSTemplateEngine.estimateSMSCount(shortMessage)).toBe(1);
    expect(SMSTemplateEngine.estimateSMSCount(longMessage)).toBe(1);
    expect(SMSTemplateEngine.estimateSMSCount(twoPartMessage)).toBe(2);
  });

  test('should handle unicode correctly', () => {
    const unicodeMessage = '₹100 payment due'; // Contains unicode rupee symbol
    const count = SMSTemplateEngine.estimateSMSCount(unicodeMessage);

    expect(count).toBeGreaterThan(0);
  });
});

describe('SMSService', () => {
  let smsService: SMSService;

  beforeEach(() => {
    smsService = new SMSService({
      twilioAccountSid: 'test-sid',
      twilioAuthToken: 'test-token',
      twilioPhoneNumber: '+911234567890',
      costPerSMS: 0.47,
      rateLimitPerPhone: 5,
      rateLimitPerSchool: 1000,
      maxRetries: 3,
      requestTimeout: 10000,
    });
  });

  test('should send SMS successfully', async () => {
    const response = await smsService.sendSMS({
      schoolId: 'school-1',
      recipients: ['9876543210'],
      templateId: SMSTemplateType.ATTENDANCE,
      variables: {
        parentName: 'Mr. Sharma',
        studentName: 'Rohan',
        subjects: 'Math, Science',
        schoolName: 'DPS School',
      },
    });

    expect(response.successful).toBeGreaterThan(0);
    expect(response.totalCost).toBeGreaterThan(0);
  });

  test('should handle multiple recipients', async () => {
    const response = await smsService.sendSMS({
      schoolId: 'school-1',
      recipients: ['9876543210', '9876543211', '9876543212'],
      templateId: SMSTemplateType.ANNOUNCEMENT,
      variables: {
        schoolName: 'DPS School',
        message: 'School closed tomorrow',
      },
    });

    expect(response.recipients).toBe(3);
    expect(response.details.length).toBe(3);
  });

  test('should reject invalid template', async () => {
    const invalidSend = smsService.sendSMS({
      schoolId: 'school-1',
      recipients: ['9876543210'],
      templateId: SMSTemplateType.GRADES,
      variables: {
        parentName: 'Mr. Sharma',
        // Missing required variables
      },
    });

    await expect(invalidSend).rejects.toThrow();
  });

  test('should track SMS cost correctly', async () => {
    const response = await smsService.sendSMS({
      schoolId: 'school-1',
      recipients: ['9876543210'],
      templateId: SMSTemplateType.GRADES,
      variables: {
        parentName: 'Mr. Sharma',
        studentName: 'Aman',
        marks: '95',
        subject: 'Math',
        schoolName: 'DPS School',
      },
    });

    // Cost should be calculated per SMS
    expect(response.totalCost).toBeGreaterThan(0);
    expect(response.totalCost).toBeLessThan(10); // Should be < ₹10 for one SMS
  });
});

describe('SMS Integration', () => {
  test('complete workflow: validate -> render -> send', async () => {
    const smsService = new SMSService({
      twilioAccountSid: 'test-sid',
      twilioAuthToken: 'test-token',
      twilioPhoneNumber: '+911234567890',
      costPerSMS: 0.47,
      rateLimitPerPhone: 5,
      rateLimitPerSchool: 1000,
      maxRetries: 3,
      requestTimeout: 10000,
    });

    const variables = {
      parentName: 'Mr. Kumar',
      studentName: 'Amit',
      subjects: 'English, Hindi, Math',
      schoolName: 'ABC Public School',
    };

    // Validate
    const validation = SMSTemplateEngine.validateVariables(
      SMSTemplateType.ATTENDANCE,
      variables
    );
    expect(validation.valid).toBe(true);

    // Render
    const render = SMSTemplateEngine.render(SMSTemplateType.ATTENDANCE, variables);
    expect(render.success).toBe(true);

    // Send
    const response = await smsService.sendSMS({
      schoolId: 'school-1',
      recipients: ['9876543210'],
      templateId: SMSTemplateType.ATTENDANCE,
      variables,
    });

    expect(response.successful).toBeGreaterThan(0);
  });
});
