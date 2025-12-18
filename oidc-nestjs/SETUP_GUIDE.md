# 🚀 Setup Guide - NestJS OpenID Connect Provider

This guide will help you set up and run the NestJS OIDC provider with ABP Framework database structure.

## 📋 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd oidc-nestjs
npm install
```

### Step 2: Run Database Migrations

This will create all the OpenIddict tables in your MySQL database:

```bash
npm run migration:run
```

Expected tables created:

- ✅ `users`
- ✅ `openiddict_applications`
- ✅ `openiddict_scopes`
- ✅ `openiddict_authorizations`
- ✅ `openiddict_tokens`

### Step 3: Seed Initial Data

```bash
npm run seed
```

This will create:

- **Scopes**: openid, profile, email, offline_access
- **Clients**: admin_client, oidc_client
- **Users**: demo, admin

### Step 4: Start the Server

```bash
npm run start:dev
```

You should see:

```
╔═══════════════════════════════════════════════════════════════╗
║   🚀 NestJS OpenID Connect Provider                          ║
║   Server running at: http://localhost:3000                   ║
╚═══════════════════════════════════════════════════════════════╝
```

### Step 5: Test the Provider

Open your browser and navigate to:

```
http://localhost:3000/.well-known/openid-configuration
```

You should see the OpenID Connect discovery document.

### Step 6: Test with Admin App

```bash
# In a new terminal
cd ../admin
npm install
npm run dev
```

Navigate to `http://localhost:4000` and test the login flow!

## 🔧 Troubleshooting

### Database Connection Issues

If you get connection errors, check your `.env` file:

```env
DB_HOST=147.93.156.241
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=Long@1234
DB_DATABASE=test_db
```

### Migration Issues

If migrations fail, you can reset:

```bash
npm run migration:revert
npm run migration:run
```

### Port Already in Use

If port 3000 is busy, change in `.env`:

```env
PORT=3001
```

## 📊 Database Schema Verification

You can verify the tables using MySQL:

```sql
-- Check all tables
SHOW TABLES;

-- Check applications
SELECT client_id, display_name, client_type FROM openiddict_applications;

-- Check scopes
SELECT name, display_name FROM openiddict_scopes;

-- Check users
SELECT username, email FROM users;
```

## 🎯 Testing Authentication Flow

1. **Start the provider**: `npm run start:dev`
2. **Open admin app**: `http://localhost:4000`
3. **Click "Sign in with OpenID Connect"**
4. **Enter credentials**: `demo` / `demo123`
5. **Authorize the application**
6. **You should be redirected to dashboard**

## 🔑 Default Credentials

| Username | Password | Description |
| -------- | -------- | ----------- |
| demo     | demo123  | Demo user   |
| admin    | admin123 | Admin user  |

## 🌐 OIDC Endpoints Reference

- **Authorization**: `http://localhost:3000/auth`
- **Token**: `http://localhost:3000/token`
- **UserInfo**: `http://localhost:3000/me`
- **JWKS**: `http://localhost:3000/.well-known/jwks.json`
- **Discovery**: `http://localhost:3000/.well-known/openid-configuration`

## 🛠️ Development Workflow

### Creating New Migrations

After modifying entities:

```bash
npm run migration:generate -- src/database/migrations/MyMigration
npm run migration:run
```

### Adding New Clients

You can add clients via database seeder or directly in the database:

```typescript
// In seed.ts, add to applications array:
{
  client_id: 'my_new_client',
  client_secret: await bcrypt.hash('secret123', 10),
  client_type: 'confidential',
  application_type: 'web',
  display_name: 'My New Client',
  consent_type: 'explicit',
  permissions: [
    'gt:authorization_code',
    'gt:refresh_token',
    'scp:openid',
    'scp:profile',
    'scp:email',
  ],
  redirect_uris: ['http://localhost:5000/callback'],
  post_logout_redirect_uris: ['http://localhost:5000'],
}
```

### Adding New Scopes

```typescript
// In seed.ts, add to scopes array:
{
  name: 'my_custom_scope',
  display_name: 'My Custom Scope',
  description: 'Access to custom resources',
}
```

## 📦 Project Benefits

✅ **ABP Compatible**: Same database structure as .NET ABP Framework  
✅ **Type Safe**: Full TypeScript support with TypeORM  
✅ **Migrations**: Version-controlled database changes  
✅ **Modern Stack**: Latest NestJS and npm packages  
✅ **Production Ready**: Includes audit fields, soft deletes, indexing  
✅ **Standards Compliant**: Full OAuth 2.0 / OpenID Connect support

## 🎓 Next Steps

1. Customize the login UI in `interaction.controller.ts`
2. Add custom claims in `main.ts` findAccount function
3. Configure additional clients and scopes
4. Set up SSL/TLS for production
5. Implement additional security features (rate limiting, etc.)

## 📞 Need Help?

Check the main [README.md](./README.md) for more details or refer to:

- [NestJS Docs](https://docs.nestjs.com)
- [oidc-provider Docs](https://github.com/panva/node-oidc-provider)
