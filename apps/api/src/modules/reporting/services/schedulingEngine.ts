// Scheduling Engine - Report scheduling and email delivery

import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { v4 as generateId } from 'uuid';
import {
  ReportSchedule,
  ScheduleFrequency,
  ReportScheduleRequest,
  ExportFormat,
} from '../types';
import { ReportBuilderService } from './reportBuilder';

// Mock email transporter (in production, use actual email service)
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
});

export class SchedulingEngine {
  private static activeJobs: Map<string, any> = new Map();

  /**
   * Create a scheduled report
   */
  static async createSchedule(
    schoolId: string,
    userId: string,
    reportId: string,
    request: ReportScheduleRequest,
  ): Promise<ReportSchedule> {
    const now = new Date();
    const nextRun = this.calculateNextRun(
      request.frequency,
      request.time,
      request.dayOfWeek,
      request.dayOfMonth,
    );

    const schedule: ReportSchedule = {
      id: `sched-${generateId()}`,
      schoolId,
      reportId,
      frequency: request.frequency,
      time: request.time,
      dayOfWeek: request.dayOfWeek,
      dayOfMonth: request.dayOfMonth,
      recipients: request.recipients,
      format: request.format,
      enabled: true,
      nextRun,
      createdAt: now,
    };

    // TODO: Save to Firestore
    // await db.collection('reports').doc(schoolId).collection('schedules').doc(schedule.id).set(schedule);

    // Start the scheduled job
    this.startScheduledJob(schoolId, schedule);

    return schedule;
  }

  /**
   * Start a scheduled job
   */
  static startScheduledJob(schoolId: string, schedule: ReportSchedule): void {
    // Generate cron expression based on schedule frequency
    const cronExpression = this.generateCronExpression(
      schedule.frequency,
      schedule.time,
      schedule.dayOfWeek,
      schedule.dayOfMonth,
    );

    const jobId = `${schoolId}-${schedule.id}`;

    // Stop existing job if running
    if (this.activeJobs.has(jobId)) {
      const existingJob = this.activeJobs.get(jobId);
      if (existingJob) clearInterval(existingJob);
    }

    // Schedule the job
    const job = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Executing scheduled report: ${schedule.id}`);

        // TODO: Fetch report definition and execute
        // const reportDef = await getReportDefinition(schoolId, schedule.reportId);
        // const execution = await ReportBuilderService.executeReport(schoolId, reportDef, schedule.format);
        // await this.sendEmail(schedule, execution);

        // Update last run
        schedule.lastRun = new Date();
        schedule.nextRun = this.calculateNextRun(
          schedule.frequency,
          schedule.time,
          schedule.dayOfWeek,
          schedule.dayOfMonth,
        );

        // TODO: Save updated schedule to Firestore
      } catch (error) {
        console.error(`Error executing scheduled report ${schedule.id}:`, error);
      }
    });

    this.activeJobs.set(jobId, job);
    console.log(`Scheduled job started: ${jobId} (${cronExpression})`);
  }

  /**
   * Stop all scheduled jobs for a school
   */
  static stopScheduledJobs(schoolId: string): void {
    const prefix = `${schoolId}-`;
    for (const [jobId, job] of this.activeJobs.entries()) {
      if (jobId.startsWith(prefix)) {
        clearInterval(job);
        this.activeJobs.delete(jobId);
        console.log(`Stopped scheduled job: ${jobId}`);
      }
    }
  }

  /**
   * Send email with report attachment
   */
  static async sendEmail(
    schedule: ReportSchedule,
    reportContent: Buffer | string,
    reportName: string = 'Report',
  ): Promise<boolean> {
    try {
      const filename = `${reportName}-${new Date().toISOString().split('T')[0]}.${this.getFileExtension(schedule.format)}`;

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@schoolerp.app',
        to: schedule.recipients.join(','),
        subject: `Scheduled Report: ${reportName}`,
        html: this.generateEmailHtml(reportName, schedule),
        attachments: [
          {
            filename,
            content:
              typeof reportContent === 'string'
                ? Buffer.from(reportContent)
                : reportContent,
          },
        ],
      };

      // In production, actually send email
      if (emailTransporter) {
        await emailTransporter.sendMail(mailOptions);
      }

      console.log(
        `Email sent to ${schedule.recipients.join(', ')} for report ${reportName}`,
      );

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Disable scheduled report
   */
  static async disableSchedule(schoolId: string, scheduleId: string): Promise<void> {
    const jobId = `${schoolId}-${scheduleId}`;

    if (this.activeJobs.has(jobId)) {
      const job = this.activeJobs.get(jobId);
      if (job) clearInterval(job);
      this.activeJobs.delete(jobId);
    }

    // TODO: Update Firestore
  }

  // Helper methods
  private static generateCronExpression(
    frequency: ScheduleFrequency,
    time: string,
    dayOfWeek?: string,
    dayOfMonth?: number,
  ): string {
    const [hour, minute] = time.split(':').map(Number);

    switch (frequency) {
      case ScheduleFrequency.DAILY:
        return `${minute} ${hour} * * *`; // Daily at specified time
      case ScheduleFrequency.WEEKLY:
        const dayMap: Record<string, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };
        const dayNum = dayMap[dayOfWeek?.toLowerCase() || 'monday'] || 1;
        return `${minute} ${hour} * * ${dayNum}`; // Weekly on specified day
      case ScheduleFrequency.MONTHLY:
        const dom = dayOfMonth || 1;
        return `${minute} ${hour} ${dom} * *`; // Monthly on specified day
      default:
        return '0 0 * * *'; // Daily at midnight (default)
    }
  }

  private static calculateNextRun(
    frequency: ScheduleFrequency,
    time: string,
    dayOfWeek?: string,
    dayOfMonth?: number,
  ): Date {
    const [hour, minute] = time.split(':').map(Number);
    const now = new Date();
    const nextRun = new Date();

    nextRun.setHours(hour, minute, 0, 0);

    switch (frequency) {
      case ScheduleFrequency.DAILY:
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case ScheduleFrequency.WEEKLY: {
        const dayMap: Record<string, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6,
        };
        const targetDay = dayMap[dayOfWeek?.toLowerCase() || 'monday'] || 1;
        const currentDay = nextRun.getDay();
        let daysAhead = targetDay - currentDay;

        if (daysAhead <= 0) {
          daysAhead += 7;
        }

        if (daysAhead === 0 && nextRun <= now) {
          daysAhead = 7;
        }

        nextRun.setDate(nextRun.getDate() + daysAhead);
        break;
      }

      case ScheduleFrequency.MONTHLY: {
        const targetDay = dayOfMonth || 1;
        nextRun.setDate(targetDay);

        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
          nextRun.setDate(targetDay);
        }
        break;
      }
    }

    return nextRun;
  }

  private static getFileExtension(format: ExportFormat): string {
    switch (format) {
      case ExportFormat.PDF:
        return 'pdf';
      case ExportFormat.EXCEL:
        return 'xlsx';
      case ExportFormat.CSV:
        return 'csv';
      default:
        return 'txt';
    }
  }

  private static generateEmailHtml(reportName: string, schedule: ReportSchedule): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <h2>${reportName}</h2>
          <p>Dear Administrator,</p>
          <p>Your scheduled report <strong>${reportName}</strong> is ready.</p>
          <p>
            <strong>Schedule Details:</strong><br/>
            Frequency: ${schedule.frequency}<br/>
            Format: ${schedule.format.toUpperCase()}
          </p>
          <p>Please find the report attached.</p>
          <p>
            Best regards,<br/>
            School ERP Team
          </p>
          <hr/>
          <p style="font-size: 12px; color: #999;">
            This is an automated email. Please do not reply.
          </p>
        </body>
      </html>
    `;
  }
}
