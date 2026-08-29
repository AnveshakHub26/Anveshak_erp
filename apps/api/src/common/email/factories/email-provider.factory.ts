import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider } from '../interfaces/email-provider.interface';
import { ConsoleEmailProvider } from '../providers/console-email.provider';
import { SmtpEmailProvider } from '../providers/smtp-email.provider';
import { ResendEmailProvider } from '../providers/resend-email.provider';
import { NullEmailProvider } from '../providers/null-email.provider';

@Injectable()
export class EmailProviderFactory {
  private readonly logger = new Logger(EmailProviderFactory.name);

  constructor(
    private readonly consoleProvider: ConsoleEmailProvider,
    private readonly smtpProvider: SmtpEmailProvider,
    private readonly resendProvider: ResendEmailProvider,
    private readonly nullProvider: NullEmailProvider,
  ) {}

  getProvider(): EmailProvider {
    const providerName = (process.env.EMAIL_PROVIDER || 'auto').toLowerCase().trim();

    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
      return this.resendProvider;
    }

    switch (providerName) {
      case 'none':
      case 'null':
        return this.nullProvider;
      case 'resend':
        return this.resendProvider;
      case 'smtp':
        return this.smtpProvider;
      case 'console':
      default:
        return this.smtpProvider || this.consoleProvider;
    }
  }
}
