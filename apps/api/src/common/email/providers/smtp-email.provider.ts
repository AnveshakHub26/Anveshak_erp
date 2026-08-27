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

      const isProd = process.env.NODE_ENV === 'production';
      let fromAddress = options.from || process.env.SMTP_FROM || process.env.EMAIL_FROM;

      if (isProd) {
        if (!fromAddress || fromAddress.includes('anveshakhub26@gmail.com')) {
          this.logger.error('Production SMTP_FROM environment variable missing: A valid sender address must be configured in production.');
          return {
            success: false,
            provider: this.name,
            error: 'Production SMTP_FROM configuration error: Sender email address must be configured in production.',
          };
        }
      } else {
        fromAddress = fromAddress || `"AnveshakHub ERP (Dev)" <no-reply@localhost>`;
      }

      const info = await activeTransporter.sendMail({
        from: fromAddress,
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
