import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { EmailService } from '../../common/email/email.service';

@Module({
  providers: [OrganizationsService, EmailService],
  controllers: [OrganizationsController],
  exports: [OrganizationsService, EmailService],
})
export class OrganizationsModule {}
