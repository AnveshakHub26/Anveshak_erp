import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dns from 'dns';
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
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    let port = parseInt(process.env.SMTP_PORT || '465', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    let isSecure = port === 465;
    if (host.includes('gmail.com')) {
      port = 465;
      isSecure = true;
    }

    const ipv4Lookup = (hostname: string, options: any, callback: any) => {
      return dns.lookup(hostname, { family: 4 }, callback);
    };

    if (host && host !== 'localhost' && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: isSecure,
        auth: { user, pass },
        lookup: ipv4Lookup,
        family: 4,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
        tls: { rejectUnauthorized: false },
      } as any);
      this.logger.log(`📧 SmtpEmailProvider configured for ${host}:${port} (Direct SSL, Custom IPv4 Resolver)`);
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

      let fromAddress =
        options.from ||
        process.env.SMTP_FROM ||
        process.env.EMAIL_FROM ||
        process.env.SMTP_USER ||
        process.env.BOOTSTRAP_ADMIN_EMAIL ||
        `"AnveshakHub Enterprise" <anveshakhub26@gmail.com>`;

      if (!fromAddress || !fromAddress.trim()) {
        fromAddress = `"AnveshakHub Enterprise" <anveshakhub26@gmail.com>`;
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
