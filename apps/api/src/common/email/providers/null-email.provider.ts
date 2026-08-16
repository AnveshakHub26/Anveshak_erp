import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, EmailOptions, SendEmailResult } from '../interfaces/email-provider.interface';

@Injectable()
export class NullEmailProvider implements EmailProvider {
  readonly name = 'null';
  private readonly logger = new Logger(NullEmailProvider.name);

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    this.logger.log(
      `[NullEmailProvider] Email suppressed for category [${options.category || 'GENERAL'}]. Recipient: ${recipients}, Subject: "${options.subject}"`,
    );
    return {
      success: true,
      messageId: `null-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      provider: this.name,
    };
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}
