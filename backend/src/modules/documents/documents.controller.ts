import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, Req, UseInterceptors, UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly svc: DocumentsService) {}

  // Public endpoint — client uploads via token link
  @Get('request/:token')
  getRequest(@Param('token') token: string) {
    return this.svc.getDocumentRequest(token);
  }

  @Post('request/:token/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async clientUpload(
    @Param('token') token: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('checklist_item_id') itemId: string,
  ) {
    const req = await this.svc.getDocumentRequest(token);
    const firmId = req.tasks?.clients?.firm_id || req.firms?.id;
    const upload = await this.svc.uploadFile(firmId, req.task_id, file, 'client', itemId);
    if (itemId) {
      await this.svc.updateChecklistItem(req.id, itemId, upload.id);
    }
    return { success: true, file: upload };
  }

  // Staff upload (auth required)
  @Post('task/:taskId/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  staffUpload(
    @Param('taskId') taskId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.svc.uploadFile(req.user.firm_id, taskId, file, req.user.id);
  }

  @Get('task/:taskId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getForTask(@Param('taskId') taskId: string, @Req() req: any) {
    return this.svc.getUploadsForTask(taskId, req.user.firm_id);
  }

  @Post('task/:taskId/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createRequest(
    @Param('taskId') taskId: string,
    @Body() dto: { client_id: string; checklist_items: string[] },
    @Req() req: any,
  ) {
    return this.svc.createDocumentRequest(taskId, req.user.firm_id, dto.client_id, dto.checklist_items);
  }
}
