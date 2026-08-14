import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Invitations & Activation')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Public()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'FND-04 Verify activation invitation token' })
  @ApiResponse({ status: 200, description: 'Token verified successfully.' })
  @ApiResponse({ status: 400, description: 'Token invalid, expired, used, or organization not approved.' })
  async verifyToken(@Body('token') token: string) {
    const data = await this.invitationsService.verifyToken(token);
    return { success: true, data };
  }

  @Public()
  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'FND-04 Complete first-time account activation and password setup' })
  @ApiResponse({ status: 200, description: 'Account activated successfully.' })
  @ApiResponse({ status: 400, description: 'Activation failed due to invalid token or password rules.' })
  async activateAccount(
    @Body()
    body: {
      token: string;
      newPassword: string;
      confirmPassword: string;
      termsConsent: boolean;
    },
  ) {
    const data = await this.invitationsService.activateAccount(body);
    return { success: true, data };
  }
}
