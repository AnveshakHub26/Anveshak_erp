import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { EmailQueueService } from './services/email-queue.service';
import { EmailProviderFactory } from './factories/email-provider.factory';
import { ConsoleEmailProvider } from './providers/console-email.provider';
import { SmtpEmailProvider } from './providers/smtp-email.provider';
import { ResendEmailProvider } from './providers/resend-email.provider';
import { NullEmailProvider } from './providers/null-email.provider';
import { PrismaService } from '../../database/prisma.service';
import { TransactionalEmailCategory } from './enums/email-category.enum';

describe('Provider-Independent Email Subsystem & Queue Worker', () => {
  let emailService: EmailService;
  let queueService: EmailQueueService;
  let providerFactory: EmailProviderFactory;
  let consoleProvider: ConsoleEmailProvider;

  const mockEmailLogs: any[] = [];

  const mockPrismaService = {
    emailLog: {
      create: jest.fn().mockImplementation((args) => {
        const record = { id: `log-${Date.now()}-${Math.random()}`, ...args.data, attempts: 0, createdAt: new Date() };
        mockEmailLogs.push(record);
        return record;
      }),
      findUnique: jest.fn().mockImplementation((args) => {
        return mockEmailLogs.find((l) => l.idempotencyKey === args.where.idempotencyKey) || null;
      }),
      findMany: jest.fn().mockImplementation((args) => {
        return mockEmailLogs.filter((l) => ['QUEUED', 'RETRYING'].includes(l.status));
      }),
      updateMany: jest.fn().mockImplementation((args) => {
        let count = 0;
        mockEmailLogs.forEach((l) => {
          if (args.where.id === l.id || args.where.status === l.status) {
            Object.assign(l, args.data);
            count++;
          }
        });
        return { count };
      }),
      update: jest.fn().mockImplementation((args) => {
        const item = mockEmailLogs.find((l) => l.id === args.where.id);
        if (item) Object.assign(item, args.data);
        return item;
      }),
    },
  };

  beforeEach(async () => {
    mockEmailLogs.length = 0;
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        EmailQueueService,
        EmailProviderFactory,
        ConsoleEmailProvider,
        SmtpEmailProvider,
        ResendEmailProvider,
        NullEmailProvider,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
    queueService = module.get<EmailQueueService>(EmailQueueService);
    providerFactory = module.get<EmailProviderFactory>(EmailProviderFactory);
    consoleProvider = module.get<ConsoleEmailProvider>(ConsoleEmailProvider);
  });

  afterEach(() => {
    queueService.onModuleDestroy();
  });

  describe('1. Provider Abstraction & Factory', () => {
    it('should default to ConsoleEmailProvider when no provider is set', () => {
      delete process.env.EMAIL_PROVIDER;
      const provider = providerFactory.getProvider();
      expect(provider.name).toBe('console');
    });

    it('should select NullEmailProvider when EMAIL_PROVIDER=none', () => {
      process.env.EMAIL_PROVIDER = 'none';
      const provider = providerFactory.getProvider();
      expect(provider.name).toBe('null');
    });

    it('should select ResendEmailProvider when EMAIL_PROVIDER=resend', () => {
      process.env.EMAIL_PROVIDER = 'resend';
      const provider = providerFactory.getProvider();
      expect(provider.name).toBe('resend');
    });

    it('should execute ConsoleEmailProvider sendEmail without error', async () => {
      const result = await consoleProvider.sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test Body</p>',
        category: TransactionalEmailCategory.SYSTEM_SECURITY_ALERT,
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('console');
      expect(result.messageId).toBeDefined();
    });
  });

  describe('2. Transactional Email Helpers & Enqueueing', () => {
    it('should enqueue password reset email asynchronously into EmailLog outbox', async () => {
      process.env.EMAIL_PROVIDER = 'console';
      const res = await emailService.sendPasswordResetEmail('user@example.com', 'reset-token-123');

      expect(res.jobId).toBeDefined();
      expect(mockPrismaService.emailLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: TransactionalEmailCategory.PASSWORD_RESET,
            recipient: 'user@example.com',
            status: 'QUEUED',
          }),
        }),
      );
    });

    it('should enqueue organization approval email with deterministic idempotency key', async () => {
      process.env.EMAIL_PROVIDER = 'console';
      const res = await emailService.sendOrganizationApprovalEmail('contact@org.com', 'Acme Corp', 'ORG-0001');

      expect(res.idempotencyKey).toContain('org-approval-ORG-0001');
      expect(mockPrismaService.emailLog.create).toHaveBeenCalled();
    });

    it('should suppress duplicate emails when idempotency key already exists', async () => {
      process.env.EMAIL_PROVIDER = 'console';
      const first = await emailService.sendOrganizationApprovalEmail('contact@org.com', 'Acme Corp', 'ORG-0001');
      const second = await emailService.sendOrganizationApprovalEmail('contact@org.com', 'Acme Corp', 'ORG-0001');

      expect(first.jobId).toBe(second.jobId);
    });

    it('should enqueue account onboarding email without exposing sensitive credentials in HTML', async () => {
      process.env.EMAIL_PROVIDER = 'console';
      await emailService.sendAccountOnboardingEmail('emp@company.com', 'Jane Doe', 'EXPERT');

      const log = mockEmailLogs[0];
      expect(log.bodyHtml).not.toContain('password');
      expect(log.bodyHtml).not.toContain('salary');
      expect(log.bodyHtml).toContain('Jane Doe');
    });
  });

  describe('3. Queue Worker, Retry Backoff & Concurrency Safety', () => {
    it('should process QUEUED jobs and update status to SENT upon successful dispatch', async () => {
      process.env.EMAIL_PROVIDER = 'console';
      await emailService.sendSecurityAlertEmail('admin@anveshak.com', 'Unauthorized Login Attempt', '<p>IP: 127.0.0.1</p>');

      await queueService.processQueue();

      const log = mockEmailLogs[0];
      expect(log.status).toBe('SENT');
      expect(log.sentAt).toBeDefined();
    });

    it('should handle provider delivery failures with exponential backoff and update status to RETRYING', async () => {
      const mockFailingProvider = {
        name: 'failing-smtp',
        sendEmail: jest.fn().mockResolvedValue({ success: false, provider: 'failing-smtp', error: 'Connection refused' }),
      };

      jest.spyOn(providerFactory, 'getProvider').mockReturnValue(mockFailingProvider as any);

      await emailService.sendTransactionalEmail({
        to: 'fail@example.com',
        subject: 'Failure Test',
        html: '<p>Body</p>',
        category: TransactionalEmailCategory.SYSTEM_SECURITY_ALERT,
      });

      await queueService.processQueue();

      const log = mockEmailLogs[0];
      expect(log.status).toBe('RETRYING');
      expect(log.attempts).toBe(1);
      expect(log.lastError).toBe('Connection refused');
      expect(log.nextAttemptAt).toBeDefined();
    });
  });
});
