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
    const providerName = (process.env.EMAIL_PROVIDER || 'console').toLowerCase().trim();

    switch (providerName) {
      case 'none':
      case 'null':
        return this.nullProvider;
      case 'smtp':
        return this.smtpProvider;
      case 'resend':
        return this.resendProvider;
      case 'console':
      default:
        return this.consoleProvider;
    }
  }
}
