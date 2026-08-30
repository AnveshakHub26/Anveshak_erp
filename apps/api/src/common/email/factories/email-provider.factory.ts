import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider } from '../interfaces/email-provider.interface';
import { ConsoleEmailProvider } from '../providers/console-email.provider';
import { SmtpEmailProvider } from '../providers/smtp-email.provider';
import { ResendEmailProvider } from '../providers/resend-email.provider';
import { BrevoEmailProvider } from '../providers/brevo-email.provider';
import { NullEmailProvider } from '../providers/null-email.provider';

@Injectable()
export class EmailProviderFactory {
  private readonly logger = new Logger(EmailProviderFactory.name);

  constructor(
    private readonly consoleProvider: ConsoleEmailProvider,
    private readonly smtpProvider: SmtpEmailProvider,
    private readonly resendProvider: ResendEmailProvider,
    private readonly brevoProvider: BrevoEmailProvider,
    private readonly nullProvider: NullEmailProvider,
  ) {}

  getProvider(): EmailProvider {
    const providerName = (process.env.EMAIL_PROVIDER || 'auto').toLowerCase().trim();

    // 1. Auto-select Brevo HTTP API if BREVO_API_KEY is set (300 free emails/day to ANY recipient, no domain verification required)
    if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim()) {
      return this.brevoProvider;
    }

    // 2. Auto-select Resend HTTP API if RESEND_API_KEY is set
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
      return this.resendProvider;
    }

    switch (providerName) {
      case 'none':
      case 'null':
        return this.nullProvider;
      case 'brevo':
        return this.brevoProvider;
      case 'resend':
        return this.resendProvider;
      case 'smtp':
        return this.smtpProvider;
      case 'console':
      default:
        return this.smtpProvider || this.consoleProvider;
    }
  }

  getFallbackProvider(): EmailProvider {
    return this.smtpProvider || this.consoleProvider;
  }
}
