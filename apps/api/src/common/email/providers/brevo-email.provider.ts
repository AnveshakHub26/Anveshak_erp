import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, EmailOptions, SendEmailResult } from '../interfaces/email-provider.interface';

@Injectable()
export class BrevoEmailProvider implements EmailProvider {
  readonly name = 'brevo';
  private readonly logger = new Logger(BrevoEmailProvider.name);

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return {
        success: false,
        provider: this.name,
        error: 'BREVO_API_KEY environment variable is missing.',
      };
    }

    const senderEmail = process.env.BREVO_FROM || process.env.SMTP_USER || 'anveshakhub26@gmail.com';
    const senderName = process.env.BREVO_FROM_NAME || 'AnveshakHub Enterprise';

    const rawRecipients = Array.isArray(options.to) ? options.to : [options.to];
    const recipients = rawRecipients.map((email) => ({ email: email.trim() }));

    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': apiKey.trim(),
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: recipients,
          subject: options.subject,
          htmlContent: options.html,
          textContent: options.text,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        this.logger.log(`[BrevoEmailProvider] Successfully delivered email to [${rawRecipients.join(', ')}] (Message ID: ${data.messageId})`);
        return {
          success: true,
          messageId: data.messageId,
          provider: this.name,
          rawResponse: data,
        };
      } else {
        const errorMsg = data.message ? `Brevo Error: ${data.message}` : JSON.stringify(data);
        this.logger.error(`[BrevoEmailProvider] Delivery failure: ${errorMsg}`);
        return {
          success: false,
          provider: this.name,
          error: errorMsg,
        };
      }
    } catch (err: any) {
      this.logger.error(`[BrevoEmailProvider] Network exception: ${err.message}`);
      return {
        success: false,
        provider: this.name,
        error: err.message,
      };
    }
  }
}
