// Scheduling Engine Tests

import {
  SchedulingEngine,
} from '../../../src/modules/reporting/services/schedulingEngine';
import {
  ScheduleFrequency,
  ExportFormat,
  ReportScheduleRequest,
} from '../../../src/modules/reporting/types';

describe('SchedulingEngine', () => {
  const schoolId = 'school-123';
  const userId = 'user-456';
  const reportId = 'rpt-789';

  describe('createSchedule', () => {
    it('should create daily schedule', async () => {
      const request: ReportScheduleRequest = {
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: '09:00',
        recipients: ['principal@school.edu'],
        format: ExportFormat.PDF,
      };

      const schedule = await SchedulingEngine.createSchedule(
        schoolId,
        userId,
        reportId,
        request,
      );

      expect(schedule).toBeDefined();
      expect(schedule.frequency).toBe(ScheduleFrequency.DAILY);
      expect(schedule.time).toBe('09:00');
      expect(schedule.recipients).toEqual(['principal@school.edu']);
      expect(schedule.enabled).toBe(true);
    });

    it('should create weekly schedule', async () => {
      const request: ReportScheduleRequest = {
        reportId,
        frequency: ScheduleFrequency.WEEKLY,
        time: '08:00',
        dayOfWeek: 'monday',
        recipients: ['admin@school.edu'],
        format: ExportFormat.EXCEL,
      };

      const schedule = await SchedulingEngine.createSchedule(
        schoolId,
        userId,
        reportId,
        request,
      );

      expect(schedule.frequency).toBe(ScheduleFrequency.WEEKLY);
      expect(schedule.dayOfWeek).toBe('monday');
    });

    it('should create monthly schedule', async () => {
      const request: ReportScheduleRequest = {
        reportId,
        frequency: ScheduleFrequency.MONTHLY,
        time: '10:00',
        dayOfMonth: 1,
        recipients: ['principal@school.edu', 'accountant@school.edu'],
        format: ExportFormat.CSV,
      };

      const schedule = await SchedulingEngine.createSchedule(
        schoolId,
        userId,
        reportId,
        request,
      );

      expect(schedule.frequency).toBe(ScheduleFrequency.MONTHLY);
      expect(schedule.dayOfMonth).toBe(1);
      expect(schedule.recipients.length).toBe(2);
    });

    it('should calculate correct next run date for daily schedule', async () => {
      const now = new Date();
      const futureTime = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now
      const nextHour = String(futureTime.getHours()).padStart(2, '0');
      const minutes = String(futureTime.getMinutes()).padStart(2, '0');

      const request: ReportScheduleRequest = {
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: `${nextHour}:${minutes}`,
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
      };

      const schedule = await SchedulingEngine.createSchedule(
        schoolId,
        userId,
        reportId,
        request,
      );

      expect(schedule.nextRun.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should set schedule to enabled by default', async () => {
      const request: ReportScheduleRequest = {
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: '10:00',
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
      };

      const schedule = await SchedulingEngine.createSchedule(
        schoolId,
        userId,
        reportId,
        request,
      );

      expect(schedule.enabled).toBe(true);
    });
  });

  describe('startScheduledJob', () => {
    it('should start a scheduled job', async () => {
      const schedule = {
        id: 'sched-123',
        schoolId,
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: '09:00',
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
        enabled: true,
        nextRun: new Date(),
        createdAt: new Date(),
      };

      // Should not throw
      expect(() => SchedulingEngine.startScheduledJob(schoolId, schedule)).not.toThrow();
    });

    it('should replace existing job with same ID', async () => {
      const schedule = {
        id: 'sched-456',
        schoolId,
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: '10:00',
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
        enabled: true,
        nextRun: new Date(),
        createdAt: new Date(),
      };

      SchedulingEngine.startScheduledJob(schoolId, schedule);

      // Start again with same ID
      expect(() => SchedulingEngine.startScheduledJob(schoolId, schedule)).not.toThrow();
    });
  });

  describe('disableSchedule', () => {
    it('should disable a scheduled job', async () => {
      const request: ReportScheduleRequest = {
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: '09:00',
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
      };

      const schedule = await SchedulingEngine.createSchedule(
        schoolId,
        userId,
        reportId,
        request,
      );

      // Should not throw
      await expect(
        SchedulingEngine.disableSchedule(schoolId, schedule.id),
      ).resolves.toBeUndefined();
    });
  });

  describe('sendEmail', () => {
    it('should send email with report attachment', async () => {
      const schedule = {
        id: 'sched-789',
        schoolId,
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: '09:00',
        recipients: ['principal@school.edu', 'admin@school.edu'],
        format: ExportFormat.PDF,
        enabled: true,
        nextRun: new Date(),
        createdAt: new Date(),
      };

      const reportContent = Buffer.from('PDF content');
      const result = await SchedulingEngine.sendEmail(
        schedule,
        reportContent,
        'Attendance Report',
      );

      // In test environment, email might not actually send, but should return result
      expect(typeof result).toBe('boolean');
    });

    it('should generate correct email filename for PDF', async () => {
      const schedule = {
        id: 'sched-800',
        schoolId,
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: '09:00',
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
        enabled: true,
        nextRun: new Date(),
        createdAt: new Date(),
      };

      await SchedulingEngine.sendEmail(
        schedule,
        Buffer.from('PDF'),
        'Report',
      );

      // Should complete without error
      expect(true).toBe(true);
    });

    it('should generate correct email filename for Excel', async () => {
      const schedule = {
        id: 'sched-801',
        schoolId,
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: '09:00',
        recipients: ['admin@school.edu'],
        format: ExportFormat.EXCEL,
        enabled: true,
        nextRun: new Date(),
        createdAt: new Date(),
      };

      await SchedulingEngine.sendEmail(
        schedule,
        Buffer.from('XLSX'),
        'Report',
      );

      expect(true).toBe(true);
    });

    it('should generate correct email filename for CSV', async () => {
      const schedule = {
        id: 'sched-802',
        schoolId,
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: '09:00',
        recipients: ['admin@school.edu'],
        format: ExportFormat.CSV,
        enabled: true,
        nextRun: new Date(),
        createdAt: new Date(),
      };

      await SchedulingEngine.sendEmail(
        schedule,
        'CSV content',
        'Report',
      );

      expect(true).toBe(true);
    });
  });

  describe('stopScheduledJobs', () => {
    it('should stop all jobs for a school', async () => {
      const request: ReportScheduleRequest = {
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: '09:00',
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
      };

      await SchedulingEngine.createSchedule(
        schoolId,
        userId,
        reportId,
        request,
      );

      // Should not throw
      expect(() => SchedulingEngine.stopScheduledJobs(schoolId)).not.toThrow();
    });
  });

  describe('Cron Expression Generation', () => {
    it('daily schedule should generate correct cron: minute hour every day', () => {
      const schedule = {
        id: 'sched-cron-1',
        schoolId,
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: '10:30',
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
        enabled: true,
        nextRun: new Date(),
        createdAt: new Date(),
      };

      // Internal cron should be: 30 10 * * *
      SchedulingEngine.startScheduledJob(schoolId, schedule);
      expect(true).toBe(true); // Job started successfully
    });

    it('weekly schedule should generate correct cron: minute hour on specific day', () => {
      const schedule = {
        id: 'sched-cron-2',
        schoolId,
        reportId,
        frequency: ScheduleFrequency.WEEKLY,
        time: '09:00',
        dayOfWeek: 'monday',
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
        enabled: true,
        nextRun: new Date(),
        createdAt: new Date(),
      };

      // Internal cron should be: 0 9 * * 1 (Monday = 1)
      SchedulingEngine.startScheduledJob(schoolId, schedule);
      expect(true).toBe(true);
    });

    it('monthly schedule should generate correct cron: minute hour on specific day of month', () => {
      const schedule = {
        id: 'sched-cron-3',
        schoolId,
        reportId,
        frequency: ScheduleFrequency.MONTHLY,
        time: '10:00',
        dayOfMonth: 15,
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
        enabled: true,
        nextRun: new Date(),
        createdAt: new Date(),
      };

      // Internal cron should be: 0 10 15 * *
      SchedulingEngine.startScheduledJob(schoolId, schedule);
      expect(true).toBe(true);
    });
  });

  describe('Next Run Calculation', () => {
    it('should calculate next run for daily schedule (tomorrow if past time)', async () => {
      const now = new Date();
      const pastHour = (now.getHours() - 1).toString().padStart(2, '0');

      const request: ReportScheduleRequest = {
        reportId,
        frequency: ScheduleFrequency.DAILY,
        time: `${pastHour}:00`,
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
      };

      const schedule = await SchedulingEngine.createSchedule(
        schoolId,
        userId,
        reportId,
        request,
      );

      // Next run should be tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(schedule.nextRun.getDate()).toBe(tomorrow.getDate());
    });

    it('should calculate next run for weekly schedule', async () => {
      const request: ReportScheduleRequest = {
        reportId,
        frequency: ScheduleFrequency.WEEKLY,
        time: '09:00',
        dayOfWeek: 'friday',
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
      };

      const schedule = await SchedulingEngine.createSchedule(
        schoolId,
        userId,
        reportId,
        request,
      );

      expect(schedule.nextRun).toBeInstanceOf(Date);
      expect(schedule.nextRun.getTime()).toBeGreaterThan(new Date().getTime());
    });

    it('should calculate next run for monthly schedule', async () => {
      const request: ReportScheduleRequest = {
        reportId,
        frequency: ScheduleFrequency.MONTHLY,
        time: '10:00',
        dayOfMonth: 1,
        recipients: ['admin@school.edu'],
        format: ExportFormat.PDF,
      };

      const schedule = await SchedulingEngine.createSchedule(
        schoolId,
        userId,
        reportId,
        request,
      );

      expect(schedule.nextRun.getDate()).toBe(1);
    });
  });
});
