import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { env, getEnvironmentSearchDirectories } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';

interface EmailMessageInput {
  toEmail: string;
  toName?: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailDeliveryResult {
  mode: 'smtp' | 'file';
  hint?: string;
}

function getRepoRoot() {
  return getEnvironmentSearchDirectories(process.cwd())[0];
}

export class EmailDeliveryService {
  private transporter: nodemailer.Transporter | null = null;

  private canUseSmtp() {
    return Boolean(env.SMTP_HOST && env.SMTP_FROM_EMAIL);
  }

  private getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
    });

    return this.transporter;
  }

  async sendEmail(message: EmailMessageInput): Promise<EmailDeliveryResult> {
    if (this.canUseSmtp()) {
      try {
        await this.getTransporter().sendMail({
          from: env.SMTP_FROM_NAME
            ? `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`
            : env.SMTP_FROM_EMAIL,
          to: message.toName ? `"${message.toName}" <${message.toEmail}>` : message.toEmail,
          subject: message.subject,
          text: message.text,
          html: message.html,
        });

        return { mode: 'smtp' };
      } catch (error) {
        throw new AppError(
          503,
          'EMAIL_DELIVERY_FAILED',
          `Unable to deliver email OTP: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (env.NODE_ENV === 'production') {
      throw new AppError(
        503,
        'EMAIL_DELIVERY_UNAVAILABLE',
        'Email delivery is not configured for OTP verification.',
      );
    }

    const outboxDir = path.join(getRepoRoot(), '.tools', 'email-outbox');
    fs.mkdirSync(outboxDir, { recursive: true });
    const fileName = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomUUID()}.json`;
    const filePath = path.join(outboxDir, fileName);

    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          toEmail: message.toEmail,
          toName: message.toName ?? '',
          subject: message.subject,
          text: message.text,
          html: message.html,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ),
      'utf8',
    );

    return {
      mode: 'file',
      hint: `Development email written to ${path.relative(getRepoRoot(), filePath)}`,
    };
  }
}
