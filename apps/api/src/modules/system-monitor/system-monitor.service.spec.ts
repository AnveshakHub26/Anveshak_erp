import { Test, TestingModule } from '@nestjs/testing';
import { SystemMonitorService } from './system-monitor.service';
import { PrismaService } from '../../database/prisma.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('SystemMonitorService Security, Health & L-01/L-04 Suite', () => {
  let service: SystemMonitorService;
  let prismaService: jest.Mocked<PrismaService>;
  let mockPrisma: any;
  const originalEnv = process.env;

  let mockSystemSettingStore: Record<string, any> = {};

  beforeEach(async () => {
    process.env = { ...originalEnv };
    mockSystemSettingStore = {};

    mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
      userActivity: {
        findUnique: jest.fn(),
        upsert: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      },
      systemSetting: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(mockSystemSettingStore[where.key] || null);
        }),
        upsert: jest.fn().mockImplementation(({ where, update, create }) => {
          if (mockSystemSettingStore[where.key]) {
            mockSystemSettingStore[where.key] = {
              ...mockSystemSettingStore[where.key],
              ...update,
            };
          } else {
            mockSystemSettingStore[where.key] = {
              key: where.key,
              ...create,
            };
          }
          return Promise.resolve(mockSystemSettingStore[where.key]);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          if (mockSystemSettingStore[where.key]) {
            mockSystemSettingStore[where.key] = {
              ...mockSystemSettingStore[where.key],
              ...data,
            };
          }
          return Promise.resolve(mockSystemSettingStore[where.key]);
        }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemMonitorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SystemMonitorService>(SystemMonitorService);
    prismaService = module.get(PrismaService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Uninitialized System Monitor Behavior', () => {
    it('should report isInitialized: false when no monitor PIN has been set', async () => {
      const status = await service.getStatus();
      expect(status.isInitialized).toBe(false);
    });

    it('should reject verifyPin with 123456789 or any PIN when uninitialized', async () => {
      await expect(service.verifyPin('123456789')).rejects.toThrow(UnauthorizedException);
      await expect(service.verifyPin('admin123')).rejects.toThrow(UnauthorizedException);
    });

    it('should reject changePassword when uninitialized', async () => {
      await expect(service.changePassword('oldPin123', 'newPin123', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Secure First-Run Initialization Flow', () => {
    it('should initialize PIN securely for an authenticated admin using Argon2id', async () => {
      const result = await service.initializePin('SuperSecretPin123!', 'admin-uuid-1');

      expect(result.success).toBe(true);
      const status = await service.getStatus();
      expect(status.isInitialized).toBe(true);

      const storedSetting = mockSystemSettingStore['SYSTEM_MONITOR_CONFIG'];
      expect(storedSetting).toBeDefined();
      expect(storedSetting.valueJson.passwordHash).toMatch(/^\$argon2id\$/);

      // Verify Argon2id hash matches initialized PIN
      const isMatch = await argon2.verify(storedSetting.valueJson.passwordHash, 'SuperSecretPin123!');
      expect(isMatch).toBe(true);
    });

    it('should prevent re-initialization if monitor PIN is already initialized', async () => {
      await service.initializePin('FirstPin123!', 'admin-uuid-1');

      await expect(service.initializePin('SecondPin123!', 'admin-uuid-2')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject initialization with PIN shorter than 6 characters', async () => {
      await expect(service.initializePin('12345', 'admin-uuid-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('L-01 Production BOOTSTRAP_ADMIN_EMAIL Hardening', () => {
    it('should REJECT forgotPassword in production when BOOTSTRAP_ADMIN_EMAIL is unconfigured or default', async () => {
      process.env.NODE_ENV = 'production';
      process.env.APP_URL = 'https://erp.anveshak.com';
      delete process.env.BOOTSTRAP_ADMIN_EMAIL;

      await service.initializePin('ValidPin123!', 'admin-uuid-1');
      await expect(service.forgotPassword('')).rejects.toThrow(BadRequestException);

      process.env.BOOTSTRAP_ADMIN_EMAIL = 'anveshakhub26@gmail.com';
      await expect(service.forgotPassword('')).rejects.toThrow(BadRequestException);
    });
  });

  describe('M-03 Production Recovery URL Hardening', () => {
    it('should REJECT forgotPassword in production when APP_URL is missing or set to localhost', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.APP_URL;

      await service.initializePin('ValidPin123!', 'admin-uuid-1');
      await expect(service.forgotPassword('admin@anveshak.com')).rejects.toThrow(BadRequestException);

      process.env.APP_URL = 'http://localhost:3000';
      await expect(service.forgotPassword('admin@anveshak.com')).rejects.toThrow(BadRequestException);
    });
  });

  describe('M-04 Health Endpoint Information Disclosure Hardening', () => {
    it('should return safe operational statuses and OMIT internal hostnames, URLs, and smtpHost', async () => {
      process.env.SMTP_HOST = 'smtp.private-internal.mail.com';
      process.env.SUPABASE_URL = 'https://abcdef.supabase.co';

      const health = await service.getSystemHealth();

      expect(health.status).toBe('OPERATIONAL');
      expect(health.services.email.status).toBe('OPERATIONAL');

      // Assert sensitive infrastructure details are NOT disclosed
      expect((health.services.email as any).host).toBeUndefined();
      expect((health.services.supabaseAuth as any).endpoint).toBeUndefined();
      expect((health as any).infrastructureLinks).toBeUndefined();
      expect((health as any).infrastructureServices).toBeUndefined();
    });
  });

  describe('L-04 Heartbeat Write Deduplication & Throttling', () => {
    it('should deduplicate rapid heartbeat calls within 60 seconds on the same route', async () => {
      const userId = 'user-heartbeat-123';
      const email = 'user@anveshak.com';

      // First call -> writes to DB
      await service.recordActivity(userId, email, 'STAFF', '/dashboard', '127.0.0.1');
      expect(mockPrisma.userActivity.upsert).toHaveBeenCalledTimes(1);

      // Second rapid call within 60s on same route -> skipped by in-memory deduplication cache
      await service.recordActivity(userId, email, 'STAFF', '/dashboard', '127.0.0.1');
      expect(mockPrisma.userActivity.upsert).toHaveBeenCalledTimes(1);

      // Call on different route -> writes to DB
      await service.recordActivity(userId, email, 'STAFF', '/projects', '127.0.0.1');
      expect(mockPrisma.userActivity.upsert).toHaveBeenCalledTimes(2);
    });
  });
});
