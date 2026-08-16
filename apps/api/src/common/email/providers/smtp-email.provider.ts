import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailProvider, EmailOptions, SendEmailResult } from '../interfaces/email-provider.interface';

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  readonly name = 'smtp';
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && host !== 'localhost' && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });
      this.logger.log(`📧 SmtpEmailProvider configured for ${host}:${port}`);
    } else {
      this.logger.warn(`⚠️ SmtpEmailProvider initialized without explicit SMTP credentials. Fallback enabled.`);
    }
  }

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    try {
      let activeTransporter = this.transporter;
      if (!activeTransporter) {
        const testAccount = await nodemailer.createTestAccount();
        activeTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
      }

      const info = await activeTransporter.sendMail({
        from: options.from || process.env.SMTP_FROM || `"AnveshakHub Enterprise ERP" <anveshakhub26@gmail.com>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`🔗 Ethereal Live Email Preview URL: ${previewUrl}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        provider: this.name,
        rawResponse: { messageId: info.messageId, previewUrl },
      };
    } catch (err: any) {
      this.logger.error(`SMTP delivery failed: ${err.message}`);
      return {
        success: false,
        provider: this.name,
        error: err.message,
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}
