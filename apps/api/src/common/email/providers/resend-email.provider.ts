import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, EmailOptions, SendEmailResult } from '../interfaces/email-provider.interface';

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';
  private readonly logger = new Logger(ResendEmailProvider.name);

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        provider: this.name,
        error: 'RESEND_API_KEY environment variable is not configured.',
      };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: options.from || process.env.SMTP_FROM || 'AnveshakHub ERP <onboarding@resend.dev>',
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        return {
          success: true,
          messageId: data.id,
          provider: this.name,
          rawResponse: data,
        };
      } else {
        return {
          success: false,
          provider: this.name,
          error: data.message || JSON.stringify(data),
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: err.message,
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    return !!process.env.RESEND_API_KEY;
  }
}
