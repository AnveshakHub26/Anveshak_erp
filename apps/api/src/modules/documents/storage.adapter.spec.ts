import { S3StorageAdapter } from './storage.adapter';
import { BadRequestException } from '@nestjs/common';

describe('C-02 & H-03 — S3StorageAdapter Security & Configuration Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('C-02 Production Storage Hardening', () => {
    it('should throw an error in production if default minio_admin credentials are configured', () => {
      process.env.NODE_ENV = 'production';
      process.env.S3_ACCESS_KEY = 'minio_admin';
      process.env.S3_SECRET_KEY = 'minio_password';
      process.env.S3_ENDPOINT = 'http://s3.us-east-1.amazonaws.com';

      expect(() => new S3StorageAdapter()).toThrow(
        /Insecure storage configuration: Default MinIO credentials or localhost endpoints are strictly forbidden in production/,
      );
    });

    it('should throw an error in production if localhost endpoint is configured for S3', () => {
      process.env.NODE_ENV = 'production';
      process.env.S3_ACCESS_KEY = 'valid_prod_key';
      process.env.S3_SECRET_KEY = 'valid_prod_secret';
      process.env.S3_ENDPOINT = 'http://localhost:9000';

      expect(() => new S3StorageAdapter()).toThrow(
        /Insecure storage configuration: Default MinIO credentials or localhost endpoints are strictly forbidden in production/,
      );
    });

    it('should fail safely when generating signed download URL in production without storage configuration', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.S3_ACCESS_KEY;
      delete process.env.S3_SECRET_KEY;
      delete process.env.S3_ENDPOINT;

      const mockSupabase: any = { isOperational: false };
      const adapter = new S3StorageAdapter(mockSupabase);

      await expect(adapter.generateSignedDownloadUrl('doc-123')).rejects.toThrow(
        /Storage service unavailable: Neither Supabase nor valid S3 storage configuration is present in production/,
      );
    });

    it('should fail safely when generating signed upload URL in production without storage configuration', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.S3_ACCESS_KEY;
      delete process.env.S3_SECRET_KEY;
      delete process.env.S3_ENDPOINT;

      const mockSupabase: any = { isOperational: false };
      const adapter = new S3StorageAdapter(mockSupabase);

      await expect(adapter.generateSignedUploadUrl('doc-123', 'application/pdf')).rejects.toThrow(
        /Storage service unavailable: Neither Supabase nor valid S3 storage configuration is present in production/,
      );
    });

    it('should successfully initialize in production with valid non-default credentials', () => {
      process.env.NODE_ENV = 'production';
      process.env.S3_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';
      process.env.S3_SECRET_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
      process.env.S3_ENDPOINT = 'https://s3.us-east-1.amazonaws.com';
      process.env.S3_BUCKET = 'anveshak-prod-docs';

      const adapter = new S3StorageAdapter();
      expect(adapter).toBeDefined();
    });

    it('should use Supabase Storage in production if Supabase is operational', async () => {
      process.env.NODE_ENV = 'production';
      const mockSupabase: any = {
        isOperational: true,
        storage: {
          from: jest.fn().mockReturnValue({
            createSignedUrl: jest.fn().mockResolvedValue({
              data: { signedUrl: 'https://supabase.co/storage/v1/object/sign/test.pdf?token=abc' },
              error: null,
            }),
          }),
        },
      };

      const adapter = new S3StorageAdapter(mockSupabase);
      const url = await adapter.generateSignedDownloadUrl('test.pdf');
      expect(url).toBe('https://supabase.co/storage/v1/object/sign/test.pdf?token=abc');
    });
  });

  describe('H-03 External URL Download & Path Traversal Prevention', () => {
    it('REJECTS absolute http:// URLs passed as storage keys with BadRequestException', async () => {
      const adapter = new S3StorageAdapter();
      await expect(adapter.generateSignedDownloadUrl('http://evil-attacker.com/malware.exe')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('REJECTS absolute https:// URLs passed as storage keys with BadRequestException', async () => {
      const adapter = new S3StorageAdapter();
      await expect(adapter.generateSignedDownloadUrl('https://evil-attacker.com/malware.exe')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('REJECTS protocol-relative // URLs passed as storage keys with BadRequestException', async () => {
      const adapter = new S3StorageAdapter();
      await expect(adapter.generateSignedDownloadUrl('//evil-attacker.com/malware.exe')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('REJECTS path traversal attempts (../) passed as storage keys with BadRequestException', async () => {
      const adapter = new S3StorageAdapter();
      await expect(adapter.generateSignedDownloadUrl('../../etc/passwd')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Development Environment Flexibility', () => {
    it('should allow local MinIO defaults in non-production environments', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.S3_ACCESS_KEY;
      delete process.env.S3_SECRET_KEY;
      delete process.env.S3_ENDPOINT;

      const adapter = new S3StorageAdapter();
      expect(adapter).toBeDefined();
    });
  });
});
