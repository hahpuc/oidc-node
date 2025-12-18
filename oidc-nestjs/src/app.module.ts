import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeOrmConfig } from "./config/typeorm.config";
import { UserModule } from "./modules/user.module";
import { OidcModule } from "./modules/oidc.module";
import { InteractionController } from "./controllers/interaction.controller";
import { OidcAdapter } from "./adapters/oidc.adapter";
import { Application } from "./entities/application.entity";
import { Authorization } from "./entities/authorization.entity";
import { Scope } from "./entities/scope.entity";
import { Token } from "./entities/token.entity";
import { User } from "./entities/user.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([Application, Authorization, Scope, Token, User]),
    UserModule,
    OidcModule,
  ],
  controllers: [InteractionController],
  providers: [OidcAdapter],
})
export class AppModule {}
