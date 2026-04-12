// SMS Template Engine

import { SMSTemplate, SMSTemplateType } from './types';

export class SMSTemplateEngine {
  private static readonly TEMPLATES: Map<SMSTemplateType, SMSTemplate> = new Map([
    [
      SMSTemplateType.ATTENDANCE,
      {
        id: SMSTemplateType.ATTENDANCE,
        template: 'Hi {{parentName}}, {{studentName}} present today ({{subjects}}). -{{schoolName}}',
        requiredVars: ['parentName', 'studentName', 'subjects', 'schoolName'],
        maxLength: 160,
      },
    ],
    [
      SMSTemplateType.GRADES,
      {
        id: SMSTemplateType.GRADES,
        template: 'Hi {{parentName}}, {{studentName}} scored {{marks}}/100 in {{subject}}. -{{schoolName}}',
        requiredVars: ['parentName', 'studentName', 'marks', 'subject', 'schoolName'],
        maxLength: 160,
      },
    ],
    [
      SMSTemplateType.ANNOUNCEMENT,
      {
        id: SMSTemplateType.ANNOUNCEMENT,
        template: '{{schoolName}} announces: {{message}}',
        requiredVars: ['schoolName', 'message'],
        maxLength: 160,
      },
    ],
    [
      SMSTemplateType.FEE_DUE,
      {
        id: SMSTemplateType.FEE_DUE,
        template: 'Hi {{parentName}}, Fee ₹{{amount}} due by {{dueDate}}. Pay: {{link}}',
        requiredVars: ['parentName', 'amount', 'dueDate', 'link'],
        maxLength: 160,
      },
    ],
    [
      SMSTemplateType.HOLIDAY,
      {
        id: SMSTemplateType.HOLIDAY,
        template: '{{schoolName}} holiday on {{date}} ({{reason}})',
        requiredVars: ['schoolName', 'date', 'reason'],
        maxLength: 160,
      },
    ],
  ]);

  /**
   * Get template by ID
   */
  static getTemplate(templateId: SMSTemplateType): SMSTemplate | null {
    return this.TEMPLATES.get(templateId) || null;
  }

  /**
   * Render template with variables
   */
  static render(templateId: SMSTemplateType, variables: Record<string, any>): {
    success: boolean;
    message?: string;
    error?: string;
    length?: number;
  } {
    const template = this.getTemplate(templateId);
    if (!template) {
      return { success: false, error: `Template ${templateId} not found` };
    }

    // Check required variables
    const missingVars = template.requiredVars.filter(
      v => !(v in variables) || variables[v] === null || variables[v] === undefined
    );

    if (missingVars.length > 0) {
      return {
        success: false,
        error: `Missing required variables: ${missingVars.join(', ')}`,
      };
    }

    // Replace variables
    let message = template.template;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    // Check length
    if (message.length > template.maxLength) {
      return {
        success: false,
        error: `Message exceeds max length (${message.length}/${template.maxLength})`,
        message,
        length: message.length,
      };
    }

    return { success: true, message, length: message.length };
  }

  /**
   * Validate variables against template
   */
  static validateVariables(
    templateId: SMSTemplateType,
    variables: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const template = this.getTemplate(templateId);
    const errors: string[] = [];

    if (!template) {
      errors.push(`Template ${templateId} not found`);
      return { valid: false, errors };
    }

    // Check required variables
    for (const required of template.requiredVars) {
      if (!(required in variables)) {
        errors.push(`Missing required variable: ${required}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * List all available templates
   */
  static listTemplates(): SMSTemplate[] {
    return Array.from(this.TEMPLATES.values());
  }

  /**
   * Estimate SMS count based on message length
   * Each SMS = 160 chars (or 70 chars with unicode)
   */
  static estimateSMSCount(message: string): number {
    const hasUnicode = /[\u0080-\uFFFF]/.test(message);
    const charsPerSMS = hasUnicode ? 70 : 160;
    return Math.ceil(message.length / charsPerSMS);
  }
}

export default SMSTemplateEngine;
