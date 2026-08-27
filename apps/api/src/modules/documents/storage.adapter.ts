import { Injectable, Logger, Optional, BadRequestException } from '@nestjs/common';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class S3StorageAdapter {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private isMinIODefault: boolean = false;
  private isS3Configured: boolean = false;

  constructor(@Optional() private supabaseService?: SupabaseService) {
    const isProd = process.env.NODE_ENV === 'production';

    const rawBucket = process.env.SUPABASE_STORAGE_BUCKET || process.env.S3_BUCKET;
    if (isProd && !rawBucket && !this.supabaseService?.isOperational) {
      this.logger.error(
        'Production storage configuration alert: Neither SUPABASE_STORAGE_BUCKET nor S3_BUCKET is specified.',
      );
    }
    this.bucketName = rawBucket || 'anveshak-private-documents';

    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || 'us-east-1';
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true' || true;

    if (isProd) {
      // C-02 Security: Production MUST NEVER fall back to local MinIO credentials or localhost
      if (
        accessKeyId === 'minio_admin' ||
        secretAccessKey === 'minio_password' ||
        (endpoint && (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')))
      ) {
        throw new Error(
          'Insecure storage configuration: Default MinIO credentials or localhost endpoints are strictly forbidden in production.',
        );
      }

      if (accessKeyId && secretAccessKey && endpoint) {
        this.s3Client = new S3Client({
          endpoint,
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          forcePathStyle,
        });
        this.isS3Configured = true;
      } else {
        this.logger.log('Production S3 credentials not configured; relying on Supabase Storage if available.');
      }
    } else {
      // Development mode: Fall back safely to local development MinIO
      const devEndpoint = endpoint || 'http://localhost:9000';
      const devAccessKey = accessKeyId || 'minio_admin';
      const devSecretKey = secretAccessKey || 'minio_password';

      this.isMinIODefault = !endpoint || endpoint.includes('localhost:9000');
      this.s3Client = new S3Client({
        endpoint: devEndpoint,
        region,
        credentials: {
          accessKeyId: devAccessKey,
          secretAccessKey: devSecretKey,
        },
        forcePathStyle,
      });
      this.isS3Configured = true;
    }

    this.logger.log(
      `Initialized Storage Adapter (Bucket: ${this.bucketName}, Supabase Operational: ${this.supabaseService?.isOperational || false}, S3 Configured: ${this.isS3Configured})`,
    );
  }

  /**
   * H-03 Security: Validates storage object keys to prevent URL redirection bypasses & path traversal.
   */
  private validateStorageKey(key: string): string {
    if (!key || typeof key !== 'string' || !key.trim()) {
      throw new BadRequestException('Storage key is required.');
    }
    const cleanKey = key.trim();
    if (
      cleanKey.startsWith('http://') ||
      cleanKey.startsWith('https://') ||
      cleanKey.startsWith('//') ||
      cleanKey.startsWith('file://') ||
      cleanKey.startsWith('data:') ||
      cleanKey.includes('../') ||
      cleanKey.includes('..\\')
    ) {
      throw new BadRequestException(
        'Invalid storage key: Absolute URLs, protocol-relative URLs, and path traversal are strictly forbidden.',
      );
    }
    return cleanKey;
  }

  async generateSignedDownloadUrl(rawKey: string, expiresInSeconds = 300): Promise<string> {
    const key = this.validateStorageKey(rawKey);

    if (this.supabaseService?.isOperational && this.supabaseService?.storage) {
      try {
        const { data, error } = await this.supabaseService.storage
          .from(this.bucketName)
          .createSignedUrl(key, expiresInSeconds);

        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }

        const publicData = this.supabaseService.storage.from(this.bucketName).getPublicUrl(key);
        if (publicData?.data?.publicUrl) {
          return publicData.data.publicUrl;
        }
      } catch (err: any) {
        this.logger.warn(`Supabase Storage signed URL fallback: ${err.message}`);
      }
    }

    if (this.isS3Configured && this.s3Client && !this.isMinIODefault) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
      } catch (err: any) {
        this.logger.warn(`S3 signed URL generation warning: ${err.message}`);
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Storage service unavailable: Neither Supabase nor valid S3 storage configuration is present in production.',
      );
    }

    // Default safe dev stream fallback for local development only
    const apiUrl = process.env.API_URL || 'http://localhost:4000/api/v1';
    return `${apiUrl}/documents/file-stream?key=${encodeURIComponent(key)}`;
  }

  async generateSignedUploadUrl(rawKey: string, contentType: string, expiresInSeconds = 300): Promise<string> {
    const key = this.validateStorageKey(rawKey);
    if (this.supabaseService?.isOperational && this.supabaseService?.storage) {
      try {
        const { data, error } = await this.supabaseService.storage
          .from(this.bucketName)
          .createSignedUploadUrl(key);

        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
      } catch (err: any) {
        this.logger.warn(`Supabase Storage signed upload URL fallback: ${err.message}`);
      }
    }

    if (this.isS3Configured && this.s3Client && !this.isMinIODefault) {
      try {
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: contentType,
        });

        return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
      } catch (err: any) {
        this.logger.warn(`S3 signed upload URL generation warning: ${err.message}`);
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Storage service unavailable: Neither Supabase nor valid S3 storage configuration is present in production.',
      );
    }

    const apiUrl = process.env.API_URL || 'http://localhost:4000/api/v1';
    return `${apiUrl}/documents/upload-direct?key=${encodeURIComponent(key)}`;
  }
}

