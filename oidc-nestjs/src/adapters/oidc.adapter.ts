import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { Token, Authorization, Application } from "../entities";
import { v4 as uuidv4 } from "uuid";

/**
 * TypeORM Adapter for oidc-provider
 * Maps oidc-provider storage operations to OpenIddict database structure
 */
@Injectable()
export class OidcAdapter {
  private readonly MODEL_MAP = {
    Session: "Session",
    AccessToken: "access_token",
    AuthorizationCode: "authorization_code",
    RefreshToken: "refresh_token",
    DeviceCode: "device_code",
    ClientCredentials: "client_credentials",
    Client: "Client",
    InitialAccessToken: "initial_access_token",
    RegistrationAccessToken: "registration_access_token",
    Interaction: "Interaction",
    ReplayDetection: "ReplayDetection",
    BackchannelAuthenticationRequest: "backchannel_authentication_request",
    Grant: "Grant",
  };

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    @InjectRepository(Authorization)
    private readonly authorizationRepository: Repository<Authorization>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>
  ) {}

  /**
   * Create an adapter instance for a specific model name
   */
  createAdapter(name: string) {
    const modelType = this.MODEL_MAP[name] || name;
    console.log(`📝 Creating adapter for model: ${name} (type: ${modelType})`);

    return {
      /**
       * Insert or update a record
       */
      upsert: async (id: string, payload: any, expiresIn: number) => {
        console.log(`🔹 Upsert ${name} with id: ${id}`);
        if (payload.uid) {
          console.log(`   uid: ${payload.uid}`);
        }
        if (payload.jti) {
          console.log(`   jti: ${payload.jti}`);
        }

        try {
          if (name === "Grant") {
            // Store Grants in Authorization table
            const expirationDate = new Date(Date.now() + expiresIn * 1000);

            // Look up application by client_id to get UUID
            const application = await this.applicationRepository.findOne({
              where: { client_id: payload.clientId, is_deleted: false },
            });

            if (!application) {
              throw new Error(`Application not found: ${payload.clientId}`);
            }

            const existing = await this.authorizationRepository.findOne({
              where: { id },
            });

            if (existing) {
              await this.authorizationRepository.update(id, {
                properties: payload,
                scopes: payload.scopes || [],
                status: "valid",
                subject: payload.accountId,
                type: "permanent",
                concurrency_stamp: uuidv4(),
              });
            } else {
              const authorization = this.authorizationRepository.create({
                id,
                application_id: application.id, // Use UUID instead of client_id
                properties: payload,
                scopes: payload.scopes || [],
                status: "valid",
                subject: payload.accountId,
                type: "permanent",
                concurrency_stamp: uuidv4(),
                extra_properties: {},
              });
              await this.authorizationRepository.save(authorization);
            }
          } else {
            // Store tokens in Token table
            const expirationDate = expiresIn
              ? new Date(Date.now() + expiresIn * 10000)
              : null;

            // Look up application by client_id to get UUID if clientId is provided
            let applicationId = payload.clientId;
            if (payload.clientId) {
              const application = await this.applicationRepository.findOne({
                where: { client_id: payload.clientId, is_deleted: false },
              });
              if (application) {
                applicationId = application.id; // Use UUID instead of client_id
              }
            }

            const existing = await this.tokenRepository.findOne({
              where: { reference_id: id },
            });

            if (existing) {
              await this.tokenRepository.update(existing.id, {
                payload: JSON.stringify(payload),
                ...(expirationDate !== null && {
                  expiration_date: expirationDate,
                }),
                status: "valid",
                properties: payload,
                concurrency_stamp: uuidv4(),
              });
            } else {
              const tokenData: any = {
                reference_id: id,
                application_id: applicationId,
                authorization_id: payload.grantId,
                payload: JSON.stringify(payload),
                status: "valid",
                subject: payload.accountId || payload.sub,
                type: modelType,
                properties: payload,
                concurrency_stamp: uuidv4(),
                extra_properties: {},
              };
              if (expirationDate !== null) {
                tokenData.expiration_date = expirationDate;
              }
              const token = this.tokenRepository.create(tokenData);
              await this.tokenRepository.save(token);
            }
          }

          console.log(`✅ Upsert ${name} successful`);
        } catch (error) {
          console.error(`❌ Upsert ${name} failed:`, error.message);
          throw error;
        }
      },

      /**
       * Find a record by ID
       */
      find: async (id: string) => {
        console.log(`🔍 Find ${name} with id: ${id}`);
        console.log(`   Adapter model type: ${modelType}`);

        try {
          if (name === "Grant") {
            const authorization = await this.authorizationRepository.findOne({
              where: { id, is_deleted: false },
            });

            if (!authorization) {
              console.log(`❌ ${name} not found`);
              return undefined;
            }

            console.log(`✅ ${name} found`);
            console.log(
              `📦 ${name} properties:`,
              JSON.stringify(authorization.properties, null, 2)
            );
            return authorization.properties;
          } else {
            // For Sessions, try both reference_id (jti) lookup
            let token = await this.tokenRepository.findOne({
              where: { reference_id: id, is_deleted: false },
            });

            // If Session not found by jti, try searching by uid in payload
            if (!token && name === "Session") {
              console.log(
                `⚠️ Session not found by jti, searching all sessions for uid match...`
              );
              const tokens = await this.tokenRepository.find({
                where: { type: modelType, is_deleted: false },
              });

              for (const t of tokens) {
                const p =
                  typeof t.payload === "string"
                    ? JSON.parse(t.payload)
                    : t.properties;
                if (p.uid === id) {
                  console.log(`✅ Found session with matching uid`);
                  token = t;
                  break;
                }
              }
            }

            if (!token) {
              console.log(`❌ ${name} not found`);
              return undefined;
            }

            // Check expiration
            if (token.expiration_date && token.expiration_date < new Date()) {
              console.log(
                `⏰ ${name} expired at ${token.expiration_date}, current time: ${new Date()}`
              );
              await this.tokenRepository.update(token.id, {
                status: "expired",
              });
              return undefined;
            }

            const payload =
              typeof token.payload === "string"
                ? JSON.parse(token.payload)
                : token.properties;

            console.log(`✅ ${name} found`);
            console.log(
              `📦 ${name} payload:`,
              JSON.stringify(payload, null, 2)
            );

            // Check token expiration in payload
            if (payload.exp) {
              const now = Math.floor(Date.now() / 1000);
              console.log(
                `⏰ Token exp: ${payload.exp}, current time: ${now}, expired: ${now > payload.exp}`
              );
            }

            return payload;
          }
        } catch (error) {
          console.error(`❌ Find ${name} failed:`, error.message);
          return undefined;
        }
      },

      /**
       * Find a record by user code (for device flow)
       */
      findByUserCode: async (userCode: string) => {
        console.log(`🔍 FindByUserCode ${name} with code: ${userCode}`);

        try {
          const tokens = await this.tokenRepository.find({
            where: { type: modelType, is_deleted: false },
          });

          for (const token of tokens) {
            const payload =
              typeof token.payload === "string"
                ? JSON.parse(token.payload)
                : token.properties;

            if (payload.userCode === userCode) {
              console.log(`✅ ${name} found by user code`);
              return payload;
            }
          }

          console.log(`❌ ${name} not found by user code`);
          return undefined;
        } catch (error) {
          console.error(`❌ FindByUserCode ${name} failed:`, error.message);
          return undefined;
        }
      },

      /**
       * Find a record by UID
       */
      findByUid: async (uid: string) => {
        console.log(`🔍 FindByUid ${name} with uid: ${uid}`);

        try {
          const tokens = await this.tokenRepository.find({
            where: { type: modelType, is_deleted: false },
          });

          for (const token of tokens) {
            const payload =
              typeof token.payload === "string"
                ? JSON.parse(token.payload)
                : token.properties;

            if (payload.uid === uid) {
              console.log(`✅ ${name} found by uid`);
              console.log(
                `📦 ${name} payload:`,
                JSON.stringify(payload, null, 2)
              );
              return payload;
            }
          }

          console.log(`❌ ${name} not found by uid`);
          return undefined;
        } catch (error) {
          console.error(`❌ FindByUid ${name} failed:`, error.message);
          return undefined;
        }
      },

      /**
       * Delete a record by ID
       */
      destroy: async (id: string) => {
        console.log(`🗑️ Destroy ${name} with id: ${id}`);

        try {
          if (name === "Grant") {
            await this.authorizationRepository.update(
              { id },
              {
                is_deleted: true,
                deletion_time: new Date(),
                status: "revoked",
              }
            );
          } else {
            const token = await this.tokenRepository.findOne({
              where: { reference_id: id },
            });

            if (token) {
              await this.tokenRepository.update(token.id, {
                is_deleted: true,
                deletion_time: new Date(),
                status: "revoked",
              });
            }
          }

          console.log(`✅ Destroy ${name} successful`);
        } catch (error) {
          console.error(`❌ Destroy ${name} failed:`, error.message);
        }
      },

      /**
       * Revoke tokens by grant ID
       */
      revokeByGrantId: async (grantId: string) => {
        console.log(`🗑️ RevokeByGrantId ${name} with grantId: ${grantId}`);

        try {
          await this.tokenRepository.update(
            { authorization_id: grantId },
            {
              status: "revoked",
              redemption_date: new Date(),
            }
          );

          console.log(`✅ RevokeByGrantId ${name} successful`);
        } catch (error) {
          console.error(`❌ RevokeByGrantId ${name} failed:`, error.message);
        }
      },

      /**
       * Mark a token as consumed
       */
      consume: async (id: string) => {
        console.log(`🍽️ Consume ${name} with id: ${id}`);

        try {
          const token = await this.tokenRepository.findOne({
            where: { reference_id: id },
          });

          if (token) {
            const payload =
              typeof token.payload === "string"
                ? JSON.parse(token.payload)
                : token.properties;

            payload.consumed = Math.floor(Date.now() / 1000);

            await this.tokenRepository.update(token.id, {
              payload: JSON.stringify(payload),
              properties: payload,
              redemption_date: new Date(),
              concurrency_stamp: uuidv4(),
            });

            console.log(`✅ Consume ${name} successful`);
          }
        } catch (error) {
          console.error(`❌ Consume ${name} failed:`, error.message);
        }
      },
    };
  }
}
