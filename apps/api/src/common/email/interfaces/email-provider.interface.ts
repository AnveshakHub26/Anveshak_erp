export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  category?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  rawResponse?: any;
}

export interface EmailProvider {
  readonly name: string;
  sendEmail(options: EmailOptions): Promise<SendEmailResult>;
  isHealthy?(): Promise<boolean>;
}
