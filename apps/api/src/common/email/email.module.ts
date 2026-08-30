import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailQueueService } from './services/email-queue.service';
import { EmailProviderFactory } from './factories/email-provider.factory';
import { ConsoleEmailProvider } from './providers/console-email.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { ResendEmailProvider } from './providers/resend-email.provider';
import { BrevoEmailProvider } from './providers/brevo-email.provider';
import { NullEmailProvider } from './providers/null-email.provider';

@Global()
@Module({
  providers: [
    EmailService,
    EmailQueueService,
    EmailProviderFactory,
    ConsoleEmailProvider,
    SmtpEmailProvider,
    ResendEmailProvider,
    BrevoEmailProvider,
    NullEmailProvider,
  ],
  exports: [EmailService, EmailQueueService, EmailProviderFactory],
})
export class EmailModule {}
