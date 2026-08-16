import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, EmailOptions, SendEmailResult } from '../interfaces/email-provider.interface';

@Injectable()
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = 'console';
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const sampleBody = (options.text || options.html.replace(/<[^>]*>?/gm, '')).trim().substring(0, 180);

    this.logger.log(`
========================================================================================
📧 [CONSOLE EMAIL PROVIDER] TRANSACTIONAL EMAIL QUEUED & DISPATCHED
========================================================================================
Category   : ${options.category || 'GENERAL'}
Recipient  : ${recipients}
From       : ${options.from || 'System Default'}
Subject    : ${options.subject}
Idempotency: ${options.idempotencyKey || 'N/A'}
Metadata   : ${JSON.stringify(options.metadata || {})}
----------------------------------------------------------------------------------------
Body Snippet: ${sampleBody}...
========================================================================================
    `);

    return {
      success: true,
      messageId: `console-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      provider: this.name,
    };
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}
