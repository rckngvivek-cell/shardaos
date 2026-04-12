// SMS Module Export

export { SMSService } from './sms-service';
export { default as SMSTemplateEngine } from './template-engine';
export { default as smsRouter } from './routes';

export type {
  SMSSendRequest,
  SMSAuditRecord,
  SMSSendResponse,
  SMSTemplate,
  SMSConfig,
} from './types';

export { SMSTemplateType, SMSStatus } from './types';
