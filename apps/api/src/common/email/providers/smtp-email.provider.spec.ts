import { Test, TestingModule } from '@nestjs/testing';
import { SmtpEmailProvider } from './smtp-email.provider';

describe('L-02 — SmtpEmailProvider Production Sender Hardening', () => {
  let provider: SmtpEmailProvider;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SmtpEmailProvider],
    }).compile();

    provider = module.get<SmtpEmailProvider>(SmtpEmailProvider);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should REJECT sending email in production mode if SMTP_FROM is missing or hardcoded fallback', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SMTP_FROM;
    delete process.env.EMAIL_FROM;

    const res = await provider.sendEmail({
      to: 'recipient@anveshak.com',
      subject: 'Test Email',
      html: '<p>Test</p>',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Production SMTP_FROM configuration error');
  });

  it('should allow sending email in development mode with fallback sender', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SMTP_FROM;
    delete process.env.EMAIL_FROM;

    const res = await provider.sendEmail({
      to: 'recipient@anveshak.com',
      subject: 'Test Email',
      html: '<p>Test</p>',
    });

    // In dev mode, it generates test transporter or attempts send without production block
    expect(res.error).toBeUndefined();
  });
});
