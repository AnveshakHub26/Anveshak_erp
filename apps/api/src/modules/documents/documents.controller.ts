import { Controller, Get, Post, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly docsService: DocumentsService) {}

  @Public()
  @Get('file-stream')
  @ApiOperation({ summary: 'FND-10 Safe development document view and download stream' })
  async streamFile(@Query('key') key: string, @Res() res: any) {
    const rawKey = key ? decodeURIComponent(key) : 'document.pdf';
    const filename = rawKey.split('/').pop() || 'document.pdf';

    res.setHeader('Content-Type', filename.endsWith('.pdf') ? 'application/pdf' : 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    const pdfBuffer = Buffer.from(
      `%PDF-1.4\n1 0 obj\n<< /Title (${filename}) /Subject (AnveshakHub Registration Document) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >>\nendobj\n5 0 obj\n<< /Length 120 >>\nstream\nBT\n/F1 16 Tf\n50 720 Td\n(AnveshakHub Enterprise Document Viewer) Tj\n0 -30 Td\n/F1 12 Tf\n(File: ${filename}) Tj\n0 -20 Td\n(Storage Key: ${rawKey}) Tj\nET\nendstream\nendobj\n6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 7\n0000000000 65535 f \n0000000009 00000 n \n0000000092 00000 n \n0000000141 00000 n \n0000000204 00000 n \n0000000344 00000 n \n0000000516 00000 n \ntrailer\n<< /Size 7 /Root 2 0 R >>\nstartxref\n585\n%%EOF`,
    );

    return res.send(pdfBuffer);
  }

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
