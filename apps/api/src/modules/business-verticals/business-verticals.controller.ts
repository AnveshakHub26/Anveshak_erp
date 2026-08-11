import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessVerticalsService } from './business-verticals.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Business Verticals')
@Controller('business-verticals')
export class BusinessVerticalsController {
  constructor(private readonly bvService: BusinessVerticalsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Fetch the 6 official Business Verticals master data' })
  async findAll() {
    const data = await this.bvService.findAll();
    return { success: true, data };
  }

  @Public()
  @Get(':code')
  @ApiOperation({ summary: 'Fetch Business Vertical details by code (e.g. BV-01)' })
  async findOne(@Param('code') code: string) {
    const data = await this.bvService.findByCode(code);
    return { success: true, data };
  }
}
