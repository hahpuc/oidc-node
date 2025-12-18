import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application, Authorization, Scope, Token } from '../entities';
import { OidcService } from './oidc.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, Authorization, Scope, Token]),
  ],
  providers: [OidcService],
  exports: [OidcService],
})
export class OidcModule {}
