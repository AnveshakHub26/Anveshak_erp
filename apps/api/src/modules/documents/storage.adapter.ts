import { Injectable, Logger, Optional } from '@nestjs/common';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class S3StorageAdapter {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private s3Client: S3Client;
  private bucketName: string;
  private isMinIODefault: boolean;

  constructor(@Optional() private supabaseService?: SupabaseService) {
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || process.env.S3_BUCKET || 'anveshak-private-documents';

    const endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    const region = process.env.S3_REGION || 'us-east-1';
    const accessKeyId = process.env.S3_ACCESS_KEY || 'minio_admin';
    const secretAccessKey = process.env.S3_SECRET_KEY || 'minio_password';
    const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true' || true;

    this.isMinIODefault = !process.env.S3_ENDPOINT || process.env.S3_ENDPOINT.includes('localhost:9000');

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle,
    });

    this.logger.log(`Initialized Storage Adapter (Bucket: ${this.bucketName}, Supabase Operational: ${this.supabaseService?.isOperational || false})`);
  }

  async generateSignedDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
    if (!key) return '';

    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }

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

    if (!this.isMinIODefault) {
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

    // Default safe dev stream fallback so localhost:9000 ERR_CONNECTION_REFUSED never occurs
    const apiUrl = process.env.API_URL || 'http://localhost:4000/api/v1';
    return `${apiUrl}/documents/file-stream?key=${encodeURIComponent(key)}`;
  }

  async generateSignedUploadUrl(key: string, contentType: string, expiresInSeconds = 300): Promise<string> {
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

    if (!this.isMinIODefault) {
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

    const apiUrl = process.env.API_URL || 'http://localhost:4000/api/v1';
    return `${apiUrl}/documents/upload-direct?key=${encodeURIComponent(key)}`;
  }
}
