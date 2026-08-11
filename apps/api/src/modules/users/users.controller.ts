import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  @ApiOperation({ summary: 'FND-07 Update authenticated user profile fields' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: { email?: string },
  ) {
    const data = await this.usersService.updateProfile(userId, body);
    return { success: true, data };
  }

  @Get()
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'ADM-02 Searchable user account list' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.usersService.findAll(pageNum, limitNum);
    return { success: true, data };
  }

  @Get(':id')
  @Roles('ADMIN', 'HR')
  @ApiOperation({ summary: 'Get user details by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.usersService.findOne(id);
    return { success: true, data };
  }
}
