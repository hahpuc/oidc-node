import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { config } from "dotenv";
import { join } from "path";
import { Application, Scope, User } from "../../entities";

config();

const seedData = async () => {
  const dataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "147.93.156.241",
    port: 3306,
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "Long@1234",
    database: process.env.DB_DATABASE || "test_db",
    entities: [join(__dirname, "../../entities/*.entity{.ts,.js}")],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log("✅ Database connected for seeding");

    // Seed Scopes
    console.log("\n📦 Seeding scopes...");
    const scopeRepository = dataSource.getRepository(Scope);

    const scopes = [
      {
        name: "openid",
        display_name: "OpenID",
        description: "Access to OpenID authentication",
      },
      {
        name: "profile",
        display_name: "Profile",
        description: "Access to user profile information",
      },
      {
        name: "email",
        display_name: "Email",
        description: "Access to user email address",
      },
      {
        name: "offline_access",
        display_name: "Offline Access",
        description: "Access to refresh tokens",
      },
    ];

    for (const scopeData of scopes) {
      const existing = await scopeRepository.findOne({
        where: { name: scopeData.name },
      });

      if (!existing) {
        const scope = scopeRepository.create({
          ...scopeData,
          concurrency_stamp: uuidv4(),
          extra_properties: {},
        });
        await scopeRepository.save(scope);
        console.log(`  ✓ Created scope: ${scopeData.name}`);
      } else {
        console.log(`  ⊘ Scope already exists: ${scopeData.name}`);
      }
    }

    // Seed Applications (Clients)
    console.log("\n📦 Seeding applications...");
    const appRepository = dataSource.getRepository(Application);

    const applications = [
      {
        client_id: "admin_client",
        client_type: "public",
        application_type: "web",
        display_name: "Admin Dashboard",
        consent_type: "implicit",
        permissions: [
          "gt:authorization_code",
          "gt:refresh_token",
          "scp:openid",
          "scp:profile",
          "scp:email",
        ],
        redirect_uris: ["http://localhost:4000/callback"],
        post_logout_redirect_uris: ["http://localhost:4000"],
        requirements: ["pkce"],
      },
      {
        client_id: "oidc_client",
        client_secret: await bcrypt.hash("a_different_secret", 10),
        client_type: "confidential",
        application_type: "web",
        display_name: "Test Client",
        consent_type: "explicit",
        permissions: [
          "gt:authorization_code",
          "gt:refresh_token",
          "scp:openid",
          "scp:profile",
          "scp:email",
        ],
        redirect_uris: ["http://localhost:3001/cb"],
        post_logout_redirect_uris: ["http://localhost:3001"],
      },
    ];

    for (const appData of applications) {
      const existing = await appRepository.findOne({
        where: { client_id: appData.client_id },
      });

      if (!existing) {
        const app = appRepository.create({
          ...appData,
          concurrency_stamp: uuidv4(),
          extra_properties: {},
        });
        await appRepository.save(app);
        console.log(`  ✓ Created application: ${appData.client_id}`);
      } else {
        console.log(`  ⊘ Application already exists: ${appData.client_id}`);
      }
    }

    // Seed Users
    console.log("\n📦 Seeding users...");
    const userRepository = dataSource.getRepository(User);

    const users = [
      {
        username: "demo",
        password: "demo123",
        email: "demo@example.com",
        given_name: "Demo",
        family_name: "User",
        name: "Demo User",
        email_verified: true,
      },
      {
        username: "admin",
        password: "admin123",
        email: "admin@example.com",
        given_name: "Admin",
        family_name: "User",
        name: "Admin User",
        email_verified: true,
      },
    ];

    for (const userData of users) {
      const existing = await userRepository.findOne({
        where: { username: userData.username },
      });

      if (!existing) {
        const passwordHash = await bcrypt.hash(userData.password, 10);
        const user = userRepository.create({
          ...userData,
          password_hash: passwordHash,
          is_active: true,
        });
        await userRepository.save(user);
        console.log(`  ✓ Created user: ${userData.username}`);
      } else {
        console.log(`  ⊘ User already exists: ${userData.username}`);
      }
    }

    console.log("\n✅ Seeding completed successfully!");
    console.log("\n📝 Available test credentials:");
    console.log("   Username: demo | Password: demo123");
    console.log("   Username: admin | Password: admin123");

    await dataSource.destroy();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedData();
