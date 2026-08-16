import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EmailProviderFactory } from '../factories/email-provider.factory';
import { EmailOptions } from '../interfaces/email-provider.interface';

@Injectable()
export class EmailQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailQueueService.name);
  private workerInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: EmailProviderFactory,
  ) {}

  onModuleInit() {
    // Start background processing interval (polls every 5 seconds)
    this.workerInterval = setInterval(() => {
      this.processQueue().catch((err) => {
        this.logger.error(`Error in email queue worker loop: ${err.message}`);
      });
    }, 5000);
    if (this.workerInterval.unref) {
      this.workerInterval.unref();
    }
  }

  onModuleDestroy() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
    }
  }

  /**
   * Enqueues an email job into the database outbox for asynchronous processing.
   * Returns immediately without blocking the HTTP request handler.
   */
  async enqueueEmail(options: EmailOptions): Promise<{ jobId: string; idempotencyKey?: string }> {
    const provider = this.providerFactory.getProvider();
    const recipientStr = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    // Idempotency check: if an idempotency key is provided and already exists, do not duplicate
    if (options.idempotencyKey) {
      const existing = await this.prisma.emailLog.findUnique({
        where: { idempotencyKey: options.idempotencyKey },
      });
      if (existing) {
        this.logger.log(
          `[EmailQueueService] Duplicate email suppressed by idempotency key: ${options.idempotencyKey}`,
        );
        return { jobId: existing.id, idempotencyKey: existing.idempotencyKey || undefined };
      }
    }

    const logEntry = await this.prisma.emailLog.create({
      data: {
        idempotencyKey: options.idempotencyKey || null,
        category: options.category || 'GENERAL',
        recipient: recipientStr,
        subject: options.subject,
        bodyHtml: options.html,
        bodyText: options.text || null,
        provider: provider.name,
        status: 'QUEUED',
        attempts: 0,
        maxAttempts: 3,
        metadata: options.metadata ? (options.metadata as any) : null,
      },
    });

    this.logger.log(`[EmailQueueService] Enqueued email job ${logEntry.id} for [${recipientStr}]`);

    // Trigger immediate background flush (fire & forget)
    setImmediate(() => {
      this.processQueue().catch(() => {});
    });

    return { jobId: logEntry.id, idempotencyKey: logEntry.idempotencyKey || undefined };
  }

  /**
   * Processes QUEUED and RETRYING email jobs with exponential backoff & metadata persistence.
   * Employs atomic status claiming and stuck job recovery for multi-worker concurrency safety.
   */
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Stuck Job Recovery: Reset jobs stuck in PROCESSING > 5 minutes back to RETRYING
      const stuckThreshold = new Date(Date.now() - 5 * 60 * 1000);
      await this.prisma.emailLog.updateMany({
        where: {
          status: 'PROCESSING',
          updatedAt: { lte: stuckThreshold },
        },
        data: {
          status: 'RETRYING',
          lastError: 'Job processing lease expired (worker crash recovery)',
        },
      });

      // 2. Fetch pending jobs ready for dispatch
      const now = new Date();
      const pendingJobs = await this.prisma.emailLog.findMany({
        where: {
          status: { in: ['QUEUED', 'RETRYING'] },
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        },
        take: 10,
        orderBy: { createdAt: 'asc' },
      });

      for (const job of pendingJobs) {
        // Atomic status claim check to prevent race condition across multiple worker nodes
        const claimed = await this.prisma.emailLog.updateMany({
          where: { id: job.id, status: job.status },
          data: { status: 'PROCESSING', attempts: job.attempts + 1 },
        });

        if (claimed.count > 0) {
          await this.dispatchJob(job);
        }
      }
    } catch (err: any) {
      this.logger.error(`Error processing email queue: ${err.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  private async dispatchJob(job: any) {
    const provider = this.providerFactory.getProvider();
    const currentAttempt = job.attempts + 1;

    const result = await provider.sendEmail({
      to: job.recipient,
      subject: job.subject,
      html: job.bodyHtml,
      text: job.bodyText || undefined,
      category: job.category,
      idempotencyKey: job.idempotencyKey || undefined,
      metadata: job.metadata || undefined,
    });

    if (result.success) {
      await this.prisma.emailLog.update({
        where: { id: job.id },
        data: {
          status: 'SENT',
          messageId: result.messageId || null,
          provider: result.provider,
          sentAt: new Date(),
          lastError: null,
        },
      });
      this.logger.log(`[EmailQueueService] Successfully dispatched job ${job.id} via provider [${result.provider}]`);
    } else {
      const isFinalAttempt = currentAttempt >= job.maxAttempts;
      const backoffMs = Math.pow(2, currentAttempt) * 1000; // Exponential backoff: 2s, 4s, 8s...
      const nextAttemptAt = isFinalAttempt ? null : new Date(Date.now() + backoffMs);

      await this.prisma.emailLog.update({
        where: { id: job.id },
        data: {
          status: isFinalAttempt ? 'FAILED' : 'RETRYING',
          lastError: result.error || 'Unknown delivery failure',
          provider: result.provider,
          nextAttemptAt,
        },
      });

      this.logger.warn(
        `[EmailQueueService] Job ${job.id} attempt ${currentAttempt}/${job.maxAttempts} failed: ${result.error}. ${
          isFinalAttempt ? 'Marked as FAILED.' : `Scheduled retry in ${backoffMs}ms.`
        }`,
      );
    }
  }
}
