import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { ClientMetadata, Configuration, Provider } from "oidc-provider";
import { DataSource } from "typeorm";
import { OidcAdapter } from "./adapters/oidc.adapter";
import { Application, Token, Authorization } from "./entities";
import * as bcrypt from "bcrypt";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const dataSource = app.get(DataSource);
  const oidcAdapter = app.get(OidcAdapter);

  // Catch unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  });

  // Enable CORS
  app.enableCors({
    origin: configService
      .get<string>("CORS_ORIGINS", "http://localhost:4000")
      .split(","),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  // Fetch clients from database
  const applicationRepository = dataSource.getRepository(Application);
  const applications = await applicationRepository.find({
    where: { is_deleted: false },
  });

  const clients: ClientMetadata[] = applications.map((app) => ({
    client_id: app.client_id,
    client_secret: app.client_secret || undefined,
    client_type: app.client_type,
    grant_types: app.permissions
      ? app.permissions
          .filter((p) => p.startsWith("gt:"))
          .map((p) => p.replace("gt:", ""))
      : ["authorization_code"],
    response_types: app.permissions
      ?.filter((p) => p.startsWith("gt:"))
      .includes("gt:authorization_code")
      ? ["code" as any] // Cast to ResponseType
      : [],
    redirect_uris: app.redirect_uris || [],
    post_logout_redirect_uris: app.post_logout_redirect_uris || [],
    token_endpoint_auth_method:
      app.client_type === "public" ? "none" : "client_secret_basic",
    application_type: (app.application_type as "web" | "native") || "web",
    // Extract scopes from permissions (scp:openid, scp:profile, etc.)
    scope: app.permissions
      ? app.permissions
          .filter((p) => p.startsWith("scp:"))
          .map((p) => p.replace("scp:", ""))
          .join(" ")
      : "openid",
  }));

  console.log("🚀 Starting OIDC Provider... ", clients);
  console.log("📦 Loaded clients from database:", clients.length);
  console.log("🔍 Client configurations:");
  clients.forEach((client) => {
    console.log(`  - ${client.client_id}:`);
    console.log(`    Grant types: ${(client.grant_types ?? []).join(", ")}`);
    console.log(`    Scope: ${client.scope || "none"}`);
  });

  // Configure OIDC Provider
  const oidcConfig: Configuration = {
    adapter: (name: string) => oidcAdapter.createAdapter(name),
    clients: clients,
    cookies: {
      keys: [
        configService.get<string>(
          "COOKIE_SECRET",
          "your-secret-key-change-this-in-production"
        ),
      ],
    },
    findAccount: async (ctx, sub) => {
      console.log("🔍 findAccount called with sub:", sub);
      console.log("🔍 findAccount context path:", ctx?.path);
      console.log("🔍 findAccount context method:", ctx?.method);

      const userRepository = dataSource.getRepository("User");

      // Try to find by ID first, then by username (for backwards compatibility)
      let user = await userRepository.findOne({
        where: { id: sub, is_active: true },
      });

      if (!user) {
        console.log("⚠️ User not found by ID, trying username...");
        user = await userRepository.findOne({
          where: { username: sub, is_active: true },
        });
      }

      if (!user) {
        console.log("❌ User not found by ID or username");
        return undefined;
      }

      console.log("✅ User found:", user.username, "ID:", user.id);

      return {
        accountId: user.id,
        claims: async (use, scope, claims, rejected) => {
          return {
            sub: user.id,
            email: user.email,
            email_verified: user.email_verified,
            given_name: user.given_name,
            family_name: user.family_name,
            name: user.name || `${user.given_name} ${user.family_name}`,
            picture: user.picture,
          };
        },
      };
    },
    interactions: {
      url(ctx, interaction) {
        return `/interaction/${interaction.uid}`;
      },
    },
    jwks: {
      keys: [
        {
          kty: "RSA",
          use: "sig",
          alg: "RS256",
          d: "EF2Kky61jzvMYQ_B6ImXzCsQ8uQzbFJrGnB2azlpr_CFStjjUVKP4EKrSCVEasD6SGNJV2QSiNJr7j05nvuGmHMKa__rbU8fqP4qbDahUgCgWOq-zS5tGK6Ifk4II_cZ_V1F-TnrvmcOKMWBiSV-p8i72KpXXucbHGNRwASVs7--M55wp_m1UsybI2jSQ4IgyvGzTnvMmQ_GsX-XoD8u0zGU_4eN3DGc8l6hdxxuSymH0fEeL1Aj0LoCj6teRGF37a2sBQdU6mkNNAuyyirkoDqGZCGJToQLqX4F1FafnzjeIgfdneRa-vuaV380Hhr2rorWnQyBqOO27M5O_VAkJbfRaWJVrXTJ69ZgkU4GPdeYdklVL0HkU6laziTNqNMeAjnt4m51sWokVyJpvdWcb_vJ4NSCsRo7kHOz7g-UvWTXa8UW0DTDliq_TJ3rN4Gv0vn9tBlFfaeuLPpK4VNmRRDRXY_fcuzlnQwYExL9a4V_vCyGmabdb7PrUFPBcjR5",
          dp: "SX52TkZEc_eLIk5gYrKjAC643LJIw1RxMBWWewRSGLn_rbrH1he3hy7AGDUV6Uon7zkNh9R5GBVuxmlluBRAGbrhIXAAf8sWeyma3F6FIAt-MH_VkfW5K2p88PLOyVGljlv8-Z3wzdKYOlDP4yFU18LqGMqaRSDLDGhILkuZhjLYA40sfYJeJTi_HVP5UyWL4ohayqUWCT2W3DgeDDThYHmufOaqlrSLhUst6uez_cDz0BXAYIZvUuPVL_n1-_px",
          dq: "K1KYU77I6yyPA2u32rc0exp_TCG59hhpWxrmXN8yTXWyq_xYBhCJA_nHdY8UV25Hmd7q0iX2i8y2cCAFNWA5UWiSiNg9-fKRLI2nz53IM4dGfssOLwUk66wzX8r_u3XiLZsO7XNNtQZdcZmF0YuNTtzEdiNDhaOyHiwwHgShL36WNmUn00mZR__G5Qk60VvI8vsbvJU9xRnWuEVS1wRgyD7v6Nl9nIxb8N7oibCdTJLmgnRXPWvArsW0cJ-NURfr",
          e: "AQAB",
          n: "2QwX-NBMkQYedGpbPvHL7Ca0isvfmLC7lSc8XSOCLmCUIf6Bk_pdCNx2kxsmT81IoA8CfvJLHQj5vWKoVDFMLfwo4IujvsC3m2IrEg6jERE-YHfC3W5jKZtmzQYpfx5vC2_XTmcyPigtyaNVsftGfycES3B_tvphNsFmQcJjVGOsJQXXqh_TDv6FMcH4m9pngyw6wfe3GgAKA0dRTSfD0h7wLdNCeuid53lLpkQypTNdZ6_PiCMu2gr_cH5M0MPZtBb2TW12_2zOabExK1lI5-HvdPtbMT4Qzs2nd2NkjcWmlbKRZzq6IzyWt7W2EnfZDsi61PHECtTb-EQN2icl8Wnsp-0Bw66yviAOj0gn3X5hRLx-TknT_PnWMou17l5GoAojKDezcTW0iLlrfs2ixFlY28u7WklUN8uYhHvwgON6fsdefG-3bPpiRLBPZ_tgXa4doALsCwfXu2oz0vYktk31A-UYv92uJsKSUbK0_8ODTN0rslCqCYN_1a_aVt2P",
          p: "--L5BX8juLlGJk8hdPgEUmJjD7SsZuMrdq3cSibkkbaWUE5CQQ7vhLPr2dWCS1jUnY9WyoCx9QCZvhTHjORX50ykkOyBso9VJjWvYPjsrPpF7_Y6V0dKlblDmbbmRT9BW-MgjbwTivu3c2OpMXh2XLF-FOTq3t3Brs7SRnhTkD6GBDFf3X95J0PF7NELa9z2-kzPSDYz3k-9FepXnRPBM_ViDzlRw4eKUdylVuhzGbC2TRSmab9BRP0wipQKd-f5",
          q: "3Jd5CRJpQV3xUi3FiHHAwcjfsRkfXMrxfaXt0PjX2xWzxscYiDcyCF6VhHTAGsiq5SOtCp3l5mg6A9PzdR53AzM2-706D82fMwiUZvsLOVTepXkgriP_xw7rDlkOeAvjB80sL2G9scFliTzzRZ8I8E79A8DxZihfB75AIN9ijklEihnwxfhp2EgO5MYEyQRcqU1TT8wD8ekLMzd-kJUWyTz3BogiVJH__BQoB6kaDyjvQoxBgwh0hi72t9H5XqPH",
          qi: "cwK0jhzwbu8BaTmTQhwfGiqwNN3v9F4nUQ4dtnBYRI6zlki4cLb2Mf9-VhyEsUYhhdTm8R7RwO9m5Xct3gEfozdk35wuvkVwkZgL3Uho5asao0xi4aENeUk5DCkU-paO3yLSDhIs9YYuYIDjUX6QuMCPjomypuE3SRm-Dg1PGOxYvX3w_P-0kd5iBFrm4jwGTZViFOr8tl_dXgDRDWDgofOYOYcmUv2_0zt1aO3j5dhEpwdkyuDMLfVZNpJQyopJ",
          kid: "f262a3214213d194c92991d6735b153b",
        },
      ],
    },
    features: {
      devInteractions: { enabled: false },
      clientCredentials: {
        enabled: true,
      },
      introspection: {
        enabled: true,
      },
      resourceIndicators: {
        enabled: false, // Disable for now to allow userinfo endpoint access
        // When enabled, tokens with resource indicators cannot access userinfo
        // Only enable this if you need to issue tokens for specific APIs
      },
    },
    // Configure refresh token issuance policy
    issueRefreshToken: async (ctx, client, code) => {
      console.log("🔄 issueRefreshToken called:");
      console.log("  - Client ID:", client.clientId);
      console.log(
        "  - Client allows refresh_token grant?",
        client.grantTypeAllowed("refresh_token")
      );
      console.log("  - Code scopes:", Array.from(code.scopes || []));
      console.log("  - Has offline_access?", code.scopes.has("offline_access"));

      // See the Docs: => That will be have refresh token
      const shouldIssue =
        code.scopes.has("offline_access") ||
        (client.applicationType === "web" &&
          client.clientAuthMethod === "none");

      if (!client.grantTypeAllowed("refresh_token")) {
        return false;
      }

      return shouldIssue;
    },
    rotateRefreshToken: true,
    ttl: {
      AccessToken: 3600, // 1 hour
      RefreshToken: 86400 * 14, // 14 days
      IdToken: 3600, // 1 hour
      AuthorizationCode: 600, // 10 minutes
    },
    scopes: ["openid", "profile", "email", "offline_access"],
    claims: {
      profile: [
        "birthdate",
        "family_name",
        "gender",
        "given_name",
        "locale",
        "middle_name",
        "name",
        "nickname",
        "picture",
        "preferred_username",
        "profile",
        "updated_at",
        "website",
        "zoneinfo",
      ],
      email: ["email", "email_verified"],
      // offline_access doesn't return claims, it's just for refresh token
      offline_access: [],
    },
    pkce: {
      required: (ctx, client) => {
        return client.token_endpoint_auth_method === "none";
      },
    },
    renderError: async (ctx, out, error) => {
      console.error("❌ OIDC Error:", error);
      console.error("❌ Error details:", JSON.stringify(out, null, 2));
      ctx.type = "html";
      ctx.body = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial; padding: 40px; max-width: 600px; margin: 0 auto; }
            .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 4px; }
            h1 { color: #c00; }
            pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>⚠️ ${out.error}</h1>
            <p><strong>Description:</strong> ${out.error_description || "An error occurred"}</p>
            ${error ? `<pre>${error.stack || error.message || error}</pre>` : ""}
          </div>
        </body>
        </html>
      `;
    },
  };

  const issuer = configService.get<string>(
    "OIDC_ISSUER",
    "http://localhost:3000"
  );
  const provider = new Provider(issuer, oidcConfig);

  // Enable provider debug events
  provider.on("authorization.error", (ctx, error) => {
    console.error("🔴 Authorization error:", error);
  });
  provider.on("grant.error", (ctx, error) => {
    console.error("🔴 Grant error:", error);
  });
  provider.on("userinfo.error", (ctx, error) => {
    console.error("🔴 Userinfo error:", error);
  });
  provider.on("access_token.saved", () => {
    console.log("💾 Access token saved");
  });
  provider.on("access_token.destroyed", () => {
    console.log("🗑️ Access token destroyed");
  });
  provider.on("authorization.accepted", (ctx) => {
    console.log("✅ Authorization accepted");
    console.log("   Params scope:", ctx.oidc.params?.scope);
    console.log("   Prompt details:", ctx.oidc.prompts);
  });

  // Store provider in app locals for controllers
  app.use((req, res, next) => {
    req.app.locals.provider = provider;
    next();
  });

  // Mount OIDC provider routes, but skip /interaction routes (handled by NestJS)
  app.use((req, res, next) => {
    if (req.path.startsWith("/interaction")) {
      return next();
    }
    // Log OIDC requests for debugging
    if (
      req.path === "/token" ||
      req.path === "/me" ||
      req.path.startsWith("/auth")
    ) {
      console.log(`🔵 OIDC Request: ${req.method} ${req.path}`);
      if (req.path === "/token") {
        console.log("📝 Token exchange body:", req.body);
      }
      if (req.path === "/me") {
        console.log("🔑 Authorization header:", req.headers.authorization);
      }

      // Intercept response
      const originalSend = res.send;
      const originalJson = res.json;
      res.send = function (data) {
        console.log(`✅ Response status: ${res.statusCode}`);
        console.log(
          `📤 Response body:`,
          typeof data === "string" ? data.substring(0, 500) : data
        );
        return originalSend.call(this, data);
      };
      res.json = function (data) {
        console.log(`✅ Response status: ${res.statusCode}`);
        console.log(`📤 Response JSON:`, data);
        return originalJson.call(this, data);
      };
    }

    // Add finish listener to see when response completes
    res.on("finish", () => {
      if (req.path === "/me") {
        console.log(`🏁 Response finished with status: ${res.statusCode}`);
      }
    });

    // Use provider callback - wraps the Koa middleware for Express
    const callback = provider.callback();
    return callback(req, res);
  });

  const port = configService.get<number>("PORT", 3000);
  await app.listen(port);

  console.log(`
  ╔═════════════════════════════════════════════════════════════════════════════════════════════╗
  ║                                                                                             ║
  ║   🚀 NestJS OpenID Connect Provider                                                         ║
  ║                                                                                             ║
  ║   Server running at: http://localhost:${port}                                               ║
  ║   Environment: ${configService.get("NODE_ENV", "development")}                              ║
  ║                                                                                             ║
  ║   📚 OIDC Endpoints:                                                                        ║
  ║   - Authorization: http://localhost:${port}/auth                                            ║
  ║   - Token: http://localhost:${port}/token                                                   ║
  ║   - UserInfo: http://localhost:${port}/me                                                   ║
  ║   - JWKS: http://localhost:${port}/.well-known/jwks.json                                    ║
  ║   - Discovery: http://localhost:${port}/.well-known/openid-configuration                    ║
  ║                                                                                             ║
  ║   🔐 Test Credentials:                                                                      ║
  ║   - Username: demo / Password: demo123                                                      ║
  ║   - Username: admin / Password: admin123                                                    ║
  ║                                                                                             ║
  ╚═════════════════════════════════════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
