import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'anveshak_super_secret_jwt_key_change_in_production_2026!',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, InvitationsService, JwtStrategy],
  controllers: [AuthController, InvitationsController],
  exports: [AuthService, InvitationsService],
})
export class AuthModule {}
