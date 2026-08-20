import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  DocumentsService,
  GenerateUploadUrlInput,
  RegisterDocumentInput,
  CreateFolderInput,
} from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Documents Management')
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
      `%PDF-1.4\n1 0 obj\n<< /Title (${filename}) /Subject (AnveshakHub Enterprise Document) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >>\nendobj\n5 0 obj\n<< /Length 120 >>\nstream\nBT\n/F1 16 Tf\n50 720 Td\n(AnveshakHub Enterprise Document Viewer) Tj\n0 -30 Td\n/F1 12 Tf\n(File: ${filename}) Tj\n0 -20 Td\n(Storage Key: ${rawKey}) Tj\nET\nendstream\nendobj\n6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 7\n0000000000 65535 f \n0000000009 00000 n \n0000000092 00000 n \n0000000141 00000 n \n0000000204 00000 n \n0000000344 00000 n \n0000000516 00000 n \ntrailer\n<< /Size 7 /Root 2 0 R >>\nstartxref\n585\n%%EOF`,
    );

    return res.send(pdfBuffer);
  }

  @Get('employee/me')
  @ApiOperation({ summary: 'GET /api/v1/documents/employee/me — Get authenticated employee document workspace identity' })
  async getMyEmployeeDocumentIdentity(@CurrentUser() user: any) {
    const data = await this.docsService.getMyEmployeeDocumentIdentity(user);
    return { success: true, data };
  }

  @Post('upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'POST /api/v1/documents/upload-url — Generate presigned upload URL' })
  async generateUploadUrl(
    @CurrentUser() user: any,
    @Body() body: GenerateUploadUrlInput,
  ) {
    const data = await this.docsService.generateUploadUrl(user, body);
    return { success: true, data };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'POST /api/v1/documents — Register uploaded document metadata (Idempotent)' })
  async create(
    @CurrentUser() user: any,
    @Body() body: RegisterDocumentInput,
  ) {
    const data = await this.docsService.create(user, body);
    return { success: true, data };
  }

  // =========================================================================
  // FOLDER API ENDPOINTS
  // =========================================================================

  @Post('folders')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'POST /api/v1/documents/folders — Create new document folder' })
  async createFolder(@CurrentUser() user: any, @Body() body: CreateFolderInput) {
    const data = await this.docsService.createFolder(user, body);
    return { success: true, data };
  }

  @Get('folders/entity/:entityType/:entityId')
  @ApiOperation({ summary: 'GET /api/v1/documents/folders/entity/:entityType/:entityId — List folders for an entity' })
  async listFolders(
    @CurrentUser() user: any,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const data = await this.docsService.listFolders(user, entityType, entityId);
    return { success: true, data };
  }

  @Get('folders/:id')
  @ApiOperation({ summary: 'GET /api/v1/documents/folders/:id — Get folder metadata & breadcrumbs' })
  async getFolder(@CurrentUser() user: any, @Param('id') id: string) {
    const data = await this.docsService.getFolder(user, id);
    return { success: true, data };
  }

  @Patch('folders/:id')
  @ApiOperation({ summary: 'PATCH /api/v1/documents/folders/:id — Rename or move folder' })
  async updateFolder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { name?: string; parentFolderId?: string },
  ) {
    let data;
    if (body.name !== undefined) {
      data = await this.docsService.renameFolder(user, id, body.name);
    } else if (body.parentFolderId !== undefined) {
      data = await this.docsService.moveFolder(user, id, body.parentFolderId);
    } else {
      data = await this.docsService.getFolder(user, id);
    }
    return { success: true, data };
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'DELETE /api/v1/documents/folders/:id — Delete folder' })
  async deleteFolder(@CurrentUser() user: any, @Param('id') id: string) {
    const data = await this.docsService.deleteFolder(user, id);
    return { success: true, data };
  }

  @Patch(':id/folder')
  @ApiOperation({ summary: 'PATCH /api/v1/documents/:id/folder — Move document to folder' })
  async moveDocumentToFolder(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { folderId?: string },
  ) {
    const data = await this.docsService.moveDocumentToFolder(user, id, body.folderId);
    return { success: true, data };
  }

  // =========================================================================
  // DOCUMENT ENTITY QUERY & METADATA
  // =========================================================================

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'GET /api/v1/documents/entity/:entityType/:entityId — List paginated entity documents' })
  @ApiQuery({ name: 'folderId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getDocumentsByEntity(
    @CurrentUser() user: any,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('folderId') folderId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.docsService.getDocumentsByEntity(
      user,
      entityType,
      entityId,
      folderId,
      pageNum,
      limitNum,
    );
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'GET /api/v1/documents/:id — View document metadata and versions' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.docsService.findOne(id, user);
    return { success: true, data };
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'GET /api/v1/documents/:id/download-url — Generate signed download URL' })
  async getSignedDownloadUrl(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.docsService.getSignedDownloadUrl(id, user);
    return { success: true, data };
  }
}
