import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly docsService: DocumentsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'FND-10 Document Viewer - View document metadata' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.docsService.findOne(id, user);
    return { success: true, data };
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Generate authorized short-lived signed URL for private S3 storage' })
  async getSignedDownloadUrl(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.docsService.getSignedDownloadUrl(id, user);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Register uploaded document metadata' })
  async create(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      entityType: string;
      entityId: string;
      type: string;
      filename: string;
    },
  ) {
    const data = await this.docsService.create({
      ...body,
      uploadedBy: userId,
    });
    return { success: true, data };
  }
}
