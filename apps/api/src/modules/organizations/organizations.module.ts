import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { EmailService } from '../../common/email/email.service';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [DocumentsModule],
  providers: [OrganizationsService, EmailService],
  controllers: [OrganizationsController],
  exports: [OrganizationsService, EmailService],
})
export class OrganizationsModule {}
