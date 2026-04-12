// Timetable Module Export

export { TimetableService } from './service';
export { default as TimetableValidator } from './validator';
export { default as timetableRouter } from './routes';

export type {
  TimeSlot,
  Timetable,
  TimetableResponse,
  ConflictDetection,
  TimetableValidationResult,
  TimetableFilterOptions,
  FreeSlot,
} from './types';

export { DayOfWeek } from './types';
