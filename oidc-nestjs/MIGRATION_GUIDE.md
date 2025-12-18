# 🔄 Migration Guide: Express to NestJS

## Overview

This guide helps you migrate from the simple Express `oidc-provider` implementation to the new NestJS ABP-style implementation.

## Why Migrate?

| Aspect       | Old (Express) | New (NestJS)          |
| ------------ | ------------- | --------------------- |
| Structure    | Single file   | Modular architecture  |
| Database     | Simple tables | ABP OpenIddict schema |
| Migrations   | Manual SQL    | TypeORM automated     |
| Type Safety  | Minimal       | Full TypeScript       |
| Scalability  | Basic         | Enterprise-ready      |
| Audit Trail  | None          | Full audit fields     |
| Soft Deletes | No            | Yes                   |
| Testing      | Difficult     | Easy with DI          |

## Data Migration Steps

### Step 1: Export Existing Data

```bash
cd oidc-provider
```

Create a migration script `export-data.js`:

```javascript
import mysql from "mysql2/promise";
import fs from "fs";

const pool = mysql.createPool({
  host: "147.93.156.241",
  user: "root",
  password: "Long@1234",
  database: "test_oidc",
});

async function exportData() {
  // Export users
  const [users] = await pool.query("SELECT * FROM users");

  // Export old OIDC data if any
  const tables = [
    "oidc_sessions",
    "oidc_access_tokens",
    "oidc_authorization_codes",
    "oidc_refresh_tokens",
    "oidc_grants",
  ];

  const data = {
    users: users,
    oldTables: {},
  };

  for (const table of tables) {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${table}`);
      data.oldTables[table] = rows;
    } catch (err) {
      console.log(`Table ${table} doesn't exist, skipping...`);
    }
  }

  fs.writeFileSync("backup.json", JSON.stringify(data, null, 2));
  console.log("✅ Data exported to backup.json");
}

exportData();
```

Run it:

```bash
node export-data.js
```

### Step 2: Set Up NestJS Project

```bash
cd ../oidc-nestjs
npm install
npm run migration:run
```

### Step 3: Import Users

Create `import-users.js` in `oidc-nestjs/`:

```javascript
import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import * as fs from "fs";

const dataSource = new DataSource({
  type: "mysql",
  host: "147.93.156.241",
  port: 3306,
  username: "root",
  password: "Long@1234",
  database: "test_oidc",
  entities: ["dist/entities/*.entity.js"],
  synchronize: false,
});

async function importUsers() {
  await dataSource.initialize();

  const backup = JSON.parse(
    fs.readFileSync("../oidc-provider/backup.json", "utf8")
  );
  const userRepository = dataSource.getRepository("User");

  for (const oldUser of backup.users) {
    const existing = await userRepository.findOne({
      where: { username: oldUser.username },
    });

    if (!existing) {
      const user = userRepository.create({
        id: oldUser.id,
        username: oldUser.username,
        password_hash: oldUser.password, // Assuming already hashed
        email: oldUser.email || `${oldUser.username}@example.com`,
        given_name: oldUser.given_name,
        family_name: oldUser.family_name,
        name: oldUser.name,
        email_verified: true,
        is_active: true,
      });

      await userRepository.save(user);
      console.log(`✓ Imported user: ${oldUser.username}`);
    } else {
      console.log(`⊘ User already exists: ${oldUser.username}`);
    }
  }

  await dataSource.destroy();
  console.log("✅ User import complete");
}

importUsers();
```

Build and run:

```bash
npm run build
node dist/import-users.js
```

### Step 4: Run Seeder for Clients & Scopes

```bash
npm run seed
```

This creates the ABP-style clients and scopes.

### Step 5: Update Admin App Configuration

The admin app config should already work, but verify:

```typescript
// admin/src/config/auth.ts
export const AUTH_CONFIG = {
  authServiceUrl: "http://localhost:3000", // NestJS provider
  clientId: "admin_client",
  redirectUri: "http://localhost:4000/callback",
  scopes: "openid profile email",
};
```

### Step 6: Test Migration

1. **Stop old Express server**:

```bash
# In oidc-provider terminal
# Press Ctrl+C
```

2. **Start NestJS server**:

```bash
cd oidc-nestjs
npm run start:dev
```

3. **Test admin app**:

```bash
cd admin
npm run dev
```

4. **Try logging in** with migrated user credentials

## Configuration Comparison

### Old Express (app.js)

```javascript
const configuration = {
  adapter: MySQLAdapter,
  clients: [
    {
      client_id: "admin_client",
      grant_types: ["authorization_code", "refresh_token"],
      redirect_uris: ["http://localhost:4000/callback"],
      token_endpoint_auth_method: "none",
    },
  ],
  // ... other config
};
```

### New NestJS (main.ts)

```typescript
// Clients loaded from database
const applications = await applicationRepository.find({
  where: { is_deleted: false },
});

const clients = applications.map((app) => ({
  client_id: app.client_id,
  client_secret: app.client_secret,
  grant_types: extractGrantTypes(app.permissions),
  redirect_uris: app.redirect_uris,
  // ... mapped from entity
}));
```

**Key Difference**: Clients are now stored in database, not hardcoded!

## Feature Mapping

### Authentication

**Old Express**:

```javascript
// In app.js
async function authenticateUser(username, password) {
  const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  // ...
}
```

**New NestJS**:

```typescript
// In user.service.ts
async authenticate(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    const isValid = await this.validatePassword(user, password);
    return isValid ? user : null;
}
```

### User Account Finding

**Old Express**:

```javascript
findAccount: async (ctx, sub) => {
    const user = await findUserById(sub);
    return {
        accountId: user.id.toString(),
        claims: async () => ({ ... })
    };
}
```

**New NestJS**:

```typescript
findAccount: async (ctx, sub) => {
    const user = await userRepository.findOne({
        where: { id: sub, is_active: true }
    });
    return {
        accountId: user.id,
        claims: async () => ({ ... })
    };
}
```

### Token Storage

**Old Express**:

```javascript
// Simple table: oidc_access_tokens
await pool.execute(
  `INSERT INTO oidc_access_tokens (id, uid, data, expiresAt) VALUES (?, ?, ?, ?)`,
  [id, uid, data, expiresAt]
);
```

**New NestJS**:

```typescript
// ABP-style: openiddict_tokens with relationships
const token = this.tokenRepository.create({
  reference_id: id,
  application_id: payload.clientId,
  authorization_id: payload.grantId,
  payload: JSON.stringify(payload),
  expiration_date: expirationDate,
  status: "valid",
  subject: payload.accountId,
  type: "access_token",
  // + audit fields
});
await this.tokenRepository.save(token);
```

## Rollback Plan

If you need to rollback to Express:

1. **Stop NestJS server**
2. **Start old Express server**:

```bash
cd oidc-provider
node app.js
```

3. **Users are compatible** - Both use same users table

## Running Both Simultaneously (Development)

You can run both during transition:

```bash
# Terminal 1: Old Express (port 3000)
cd oidc-provider
node app.js

# Terminal 2: New NestJS (port 3001)
cd oidc-nestjs
PORT=3001 npm run start:dev

# Terminal 3: Admin app testing old
cd admin
npm run dev  # Uses port 3000

# Terminal 4: Admin app testing new
cd admin
# Edit auth.ts to use port 3001
npm run dev
```

## Benefits After Migration

### 1. Database Management

- ✅ Automated migrations
- ✅ Version control for schema
- ✅ Easy rollback

### 2. Code Organization

```
Old: app.js (1000+ lines)
New: Modular structure with:
    - Controllers (routing)
    - Services (business logic)
    - Repositories (data access)
    - Entities (models)
```

### 3. Type Safety

```typescript
// Old: any type, runtime errors
const user = await findUserById(id);
user.email; // No autocomplete

// New: Full TypeScript
const user: User = await this.userService.findById(id);
user.email; // ✅ Autocomplete + type checking
```

### 4. Testing

```typescript
// Old: Hard to test, needs real database

// New: Easy mocking with DI
const mockUserService = {
  authenticate: jest.fn().mockResolvedValue(mockUser),
};

TestingModule.createTestingModule({
  providers: [{ provide: UserService, useValue: mockUserService }],
});
```

### 5. Audit & Compliance

```typescript
// Old: No audit trail

// New: Every record has
- creation_time
- creator_id
- last_modification_time
- last_modifier_id
- is_deleted (soft delete)
- deletion_time
```

## Troubleshooting Migration

### Issue: "User not found" after migration

**Solution**: Check that user IDs match:

```sql
-- Old table
SELECT id, username FROM users;

-- New table (should be same)
SELECT id, username FROM users;
```

### Issue: "Client not found"

**Solution**: Run seeder or add client manually:

```bash
npm run seed
```

### Issue: Tokens not working

**Solution**: Clear old tokens and regenerate:

```sql
TRUNCATE TABLE openiddict_tokens;
TRUNCATE TABLE openiddict_authorizations;
```

Then login again.

## Post-Migration Checklist

- [ ] All users migrated successfully
- [ ] Can login with existing credentials
- [ ] Tokens are generated correctly
- [ ] Refresh tokens work
- [ ] Admin app can authenticate
- [ ] Database has proper indexes
- [ ] Backup of old database created
- [ ] Old Express server stopped
- [ ] Documentation updated

## Next Steps

1. **Monitor logs** for any errors
2. **Test all auth flows** (login, logout, refresh)
3. **Check database** for proper data storage
4. **Update client apps** if needed
5. **Set up monitoring** and alerting
6. **Configure production** environment
7. **Set up CI/CD** pipeline

## Need Help?

- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for setup issues
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for understanding flow
- See [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for quick reference

---

**🎉 Migration Complete!** You now have a production-ready, enterprise-grade OpenID Connect provider with ABP Framework's battle-tested database architecture.
