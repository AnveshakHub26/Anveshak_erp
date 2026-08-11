import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { S3StorageAdapter } from './storage.adapter';

@Module({
  providers: [DocumentsService, S3StorageAdapter],
  controllers: [DocumentsController],
  exports: [DocumentsService, S3StorageAdapter],
})
export class DocumentsModule {}
