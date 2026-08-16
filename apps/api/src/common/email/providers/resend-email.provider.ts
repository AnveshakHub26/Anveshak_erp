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

    // Resend account without verified domain requires onboarding@resend.dev sender
    const defaultFrom = process.env.RESEND_FROM || 'AnveshakHub ERP <onboarding@resend.dev>';
    const sender = (options.from && !options.from.includes('anveshakhub.com')) ? options.from : defaultFrom;

    let targetRecipient = Array.isArray(options.to) ? options.to[0] : options.to;
    let emailSubject = options.subject;

    // Resend Free/Dev tier constraint: onboarding@resend.dev can ONLY deliver to the registered account email.
    // If the domain is unverified, redirect development emails to verified inbox (anveshakhub26@gmail.com)
    // so emails never fail with validation_error, while preserving original recipient in subject header.
    const isUnverifiedSender = sender.includes('onboarding@resend.dev');
    const verifiedAccountEmail = process.env.RESEND_VERIFIED_RECIPIENT || 'anveshakhub26@gmail.com';

    if (isUnverifiedSender && targetRecipient.toLowerCase().trim() !== verifiedAccountEmail.toLowerCase().trim()) {
      this.logger.warn(
        `[ResendEmailProvider] Unverified domain sender constraint: Redirecting email intended for [${targetRecipient}] to verified dev account [${verifiedAccountEmail}].`,
      );
      emailSubject = `[To: ${targetRecipient}] ${emailSubject}`;
      targetRecipient = verifiedAccountEmail;
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: sender,
          to: [targetRecipient],
          subject: emailSubject,
          html: options.html,
          text: options.text,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        this.logger.log(`[ResendEmailProvider] Dispatched email to [${targetRecipient}] (Message ID: ${data.id})`);
        return {
          success: true,
          messageId: data.id,
          provider: this.name,
          rawResponse: data,
        };
      } else {
        const errorMsg = data.message ? `${data.name || 'Error'}: ${data.message}` : JSON.stringify(data);
        this.logger.error(`[ResendEmailProvider] Delivery error: ${errorMsg}`);
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
