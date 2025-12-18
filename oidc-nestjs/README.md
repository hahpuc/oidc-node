# NestJS OpenID Connect Provider

A production-ready OpenID Connect (OIDC) provider built with NestJS, following ABP Framework's database architecture with OpenIddict tables.

## 🏗️ Architecture

- **Framework**: NestJS (Latest)
- **Database**: MySQL with TypeORM
- **OIDC Library**: oidc-provider v8.5.1
- **Database Schema**: ABP Framework OpenIddict structure
- **Naming Convention**: snake_case (MySQL standard)

## 📊 Database Tables

### Core OpenIddict Tables:

1. **openiddict_applications** - OAuth2/OIDC client applications
2. **openiddict_authorizations** - User consent and authorization grants
3. **openiddict_scopes** - Available permission scopes
4. **openiddict_tokens** - Access tokens, refresh tokens, authorization codes
5. **users** - User accounts

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MySQL 8.0+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
npm run migration:run

# Seed initial data (clients, scopes, users)
npm run seed
```

### Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000`

## 🔐 Default Test Credentials

- **Username**: `demo` | **Password**: `demo123`
- **Username**: `admin` | **Password**: `admin123`

## 🎯 Pre-configured Clients

### 1. Admin Dashboard (PKCE Flow)

- **Client ID**: `admin_client`
- **Type**: Public (no client_secret)
- **Flow**: Authorization Code + PKCE
- **Redirect URI**: `http://localhost:4000/callback`

### 2. Test Client (Standard Flow)

- **Client ID**: `oidc_client`
- **Client Secret**: `a_different_secret`
- **Type**: Confidential
- **Flow**: Authorization Code
- **Redirect URI**: `http://localhost:3001/cb`

## 📝 Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload

# Database
npm run migration:generate # Generate migration from entities
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run seed              # Seed initial data

# Production
npm run build             # Build for production
npm run start:prod        # Run production build
```

## 🌐 OIDC Endpoints

- **Authorization**: `/auth`
- **Token**: `/token`
- **UserInfo**: `/me`
- **JWKS**: `/.well-known/jwks.json`
- **Discovery**: `/.well-known/openid-configuration`

## 🔧 Configuration

Edit `.env` file:

```env
# Database
DB_HOST=147.93.156.241
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=Long@1234
DB_DATABASE=test_oidc

# Application
PORT=3000
NODE_ENV=development

# OIDC
OIDC_ISSUER=http://localhost:3000

# CORS
CORS_ORIGINS=http://localhost:4000,http://localhost:3001
```

## 📚 Project Structure

```
src/
├── adapters/           # OIDC provider adapters
│   └── oidc.adapter.ts
├── config/            # Configuration files
│   └── typeorm.config.ts
├── controllers/       # REST controllers
│   └── interaction.controller.ts
├── database/
│   ├── migrations/    # Database migrations
│   └── seeders/       # Data seeders
├── entities/          # TypeORM entities
│   ├── application.entity.ts
│   ├── authorization.entity.ts
│   ├── scope.entity.ts
│   ├── token.entity.ts
│   └── user.entity.ts
├── modules/           # NestJS modules
│   ├── oidc.module.ts
│   ├── oidc.service.ts
│   ├── user.module.ts
│   └── user.service.ts
├── app.module.ts
└── main.ts
```

## 🔄 Integration with Admin App

The existing React admin app (`/admin`) is already configured to work with this NestJS provider:

```typescript
// admin/src/config/auth.ts
export const AUTH_CONFIG = {
  authServiceUrl: "http://localhost:3000",
  clientId: "admin_client",
  redirectUri: "http://localhost:4000/callback",
  scopes: "openid profile email",
};
```

## 🏆 Features

✅ **ABP Framework Compatible** - Uses same database structure as ABP/OpenIddict
✅ **TypeORM Migrations** - Version-controlled database schema
✅ **PKCE Support** - Secure flow for public clients
✅ **Snake Case** - MySQL naming conventions
✅ **Latest Packages** - All dependencies are up-to-date
✅ **Well Architected** - Following NestJS best practices
✅ **Production Ready** - Includes soft deletes, audit fields, concurrency stamps

## 📖 Learn More

- [NestJS Documentation](https://docs.nestjs.com)
- [oidc-provider Documentation](https://github.com/panva/node-oidc-provider)
- [OpenID Connect Specification](https://openid.net/specs/openid-connect-core-1_0.html)
- [ABP Framework](https://docs.abp.io/)

## 📄 License

MIT
