import fs from 'node:fs';
import path from 'node:path';

const sendMailMock = jest.fn();
const createTransportMock = jest.fn(() => ({
  sendMail: sendMailMock,
}));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: createTransportMock,
  },
}));

const originalEnv = { ...process.env };
const repoRoot = path.resolve(__dirname, '../../../../..');
const outboxDir = path.join(repoRoot, '.tools', 'email-outbox');

describe('EmailDeliveryService', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.SMTP_HOST = '';
    process.env.SMTP_PORT = '';
    process.env.SMTP_SECURE = '';
    process.env.SMTP_USER = '';
    process.env.SMTP_PASS = '';
    process.env.SMTP_PASS_FILE = '';
    process.env.SMTP_FROM_EMAIL = '';
    process.env.SMTP_FROM_NAME = '';
    process.env.NODE_ENV = 'development';
    sendMailMock.mockReset();
    createTransportMock.mockClear();
  });

  afterEach(() => {
    if (fs.existsSync(outboxDir)) {
      fs.rmSync(outboxDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses SMTP transport when SMTP is configured', async () => {
    process.env.SMTP_HOST = '127.0.0.1';
    process.env.SMTP_PORT = '1025';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_FROM_EMAIL = 'no-reply@shardaos.local';
    process.env.SMTP_FROM_NAME = 'ShardaOS Auth';

    const { EmailDeliveryService } = await import('../../../src/modules/auth/email-delivery.service.js');
    const service = new EmailDeliveryService();

    await expect(
      service.sendEmail({
        toEmail: 'owner@example.com',
        toName: 'Platform Owner',
        subject: 'OTP test',
        text: '123456',
        html: '<p>123456</p>',
      }),
    ).resolves.toEqual({ mode: 'smtp' });

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: '127.0.0.1',
        port: 1025,
        secure: false,
      }),
    );
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"ShardaOS Auth" <no-reply@shardaos.local>',
        to: '"Platform Owner" <owner@example.com>',
        subject: 'OTP test',
      }),
    );
  });

  it('falls back to file delivery in development when SMTP is not configured', async () => {
    const { EmailDeliveryService } = await import('../../../src/modules/auth/email-delivery.service.js');
    const service = new EmailDeliveryService();

    const result = await service.sendEmail({
      toEmail: 'school@example.com',
      subject: 'OTP test',
      text: '654321',
      html: '<p>654321</p>',
    });

    expect(result.mode).toBe('file');
    expect(result.hint).toContain('.tools');
    expect(fs.existsSync(outboxDir)).toBe(true);
    expect(fs.readdirSync(outboxDir)).toHaveLength(1);
  });
});
