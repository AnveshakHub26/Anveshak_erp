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

    const isProd = process.env.NODE_ENV === 'production';
    let defaultFrom = process.env.RESEND_FROM || process.env.SMTP_FROM || 'AnveshakHub ERP <onboarding@resend.dev>';
    if (!defaultFrom || !defaultFrom.includes('@')) {
      defaultFrom = 'AnveshakHub ERP <onboarding@resend.dev>';
    }

    const sender = options.from && options.from.includes('@') ? options.from : defaultFrom;
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: sender,
          to: recipients,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        this.logger.log(`[ResendEmailProvider] Dispatched email to [${recipients.join(', ')}] (Message ID: ${data.id})`);
        return {
          success: true,
          messageId: data.id,
          provider: this.name,
          rawResponse: data,
        };
      } else {
        const errorMsg = data.message ? `${data.name || 'Error'}: ${data.message}` : JSON.stringify(data);
        this.logger.error(`[ResendEmailProvider] Delivery error to [${recipients.join(', ')}]: ${errorMsg}`);
        return {
          success: false,
          provider: this.name,
          error: errorMsg,
        };
      }
    } catch (err: any) {
      this.logger.error(`[ResendEmailProvider] Network error: ${err.message}`);
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
