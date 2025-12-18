import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  All,
  Render,
  Body,
  Param,
} from "@nestjs/common";
import { Request, Response } from "express";
import { UserService } from "../modules/user.service";

@Controller("interaction")
export class InteractionController {
  constructor(private readonly userService: UserService) {}

  @Get(":uid")
  async showLogin(
    @Param("uid") uid: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const provider = req.app.locals.provider;

    try {
      const details = await provider.interactionDetails(req, res);
      const { prompt } = details;

      if (prompt.name === "login") {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Sign In</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
              h1 { color: #333; }
              form { display: flex; flex-direction: column; gap: 15px; }
              input { padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
              button { padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
              button:hover { background: #0056b3; }
              .error { color: red; padding: 10px; background: #fee; border-radius: 4px; }
            </style>
          </head>
          <body>
            <h1>🔐 Sign In</h1>
            <form method="post" action="/interaction/${uid}/login">
              <input type="text" name="username" placeholder="Username" required />
              <input type="password" name="password" placeholder="Password" required />
              <button type="submit">Sign In</button>
            </form>
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              Demo credentials: <strong>demo</strong> / <strong>demo123</strong>
            </p>
          </body>
          </html>
        `);
      }

      if (prompt.name === "consent") {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authorize</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
              h1 { color: #333; }
              .client-info { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; }
              .scopes { list-style: none; padding: 0; }
              .scopes li { padding: 8px; background: #e3f2fd; margin: 5px 0; border-radius: 4px; }
              .buttons { display: flex; gap: 10px; margin-top: 20px; }
              button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; flex: 1; }
              .approve { background: #4caf50; color: white; }
              .deny { background: #f44336; color: white; }
            </style>
          </head>
          <body>
            <h1>🔑 Authorization Request</h1>
            <div class="client-info">
              <strong>Client:</strong> ${details.params.client_id}<br>
              <strong>Scopes:</strong>
              <ul class="scopes">
                ${details.params.scope
                  .split(" ")
                  .map((scope) => `<li>✓ ${scope}</li>`)
                  .join("")}
              </ul>
            </div>
            <div class="buttons">
              <form method="post" action="/interaction/${uid}/consent" style="flex: 1;">
                <button type="submit" class="approve">Authorize</button>
              </form>
              <form method="post" action="/interaction/${uid}/abort" style="flex: 1;">
                <button type="submit" class="deny">Deny</button>
              </form>
            </div>
          </body>
          </html>
        `);
      }

      return res.send("Unknown prompt");
    } catch (err) {
      console.error("Interaction error:", err);
      return res.status(500).send("Internal Server Error");
    }
  }

  @Post(":uid/login")
  async handleLogin(
    @Param("uid") uid: string,
    @Body() body: { username: string; password: string },
    @Req() req: Request,
    @Res() res: Response
  ) {
    const provider = req.app.locals.provider;

    try {
      const user = await this.userService.authenticate(
        body.username,
        body.password
      );

      if (!user) {
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Sign In</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
              .error { color: red; padding: 10px; background: #fee; border-radius: 4px; margin-bottom: 15px; }
              h1 { color: #333; }
              form { display: flex; flex-direction: column; gap: 15px; }
              input { padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
              button { padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
            </style>
          </head>
          <body>
            <div class="error">❌ Invalid username or password</div>
            <h1>🔐 Sign In</h1>
            <form method="post" action="/interaction/${uid}/login">
              <input type="text" name="username" placeholder="Username" required />
              <input type="password" name="password" placeholder="Password" required />
              <button type="submit">Sign In</button>
            </form>
          </body>
          </html>
        `);
      }

      console.log("🔐 Login successful for user:", user.username);
      console.log("🔑 User ID:", user.id);
      console.log("👤 User object keys:", Object.keys(user));

      const result = {
        login: {
          accountId: user.id,
        },
      };

      await provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).send("Login failed");
    }
  }

  @Post(":uid/consent")
  async handleConsent(
    @Param("uid") uid: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const provider = req.app.locals.provider;

    try {
      const interactionDetails = await provider.interactionDetails(req, res);
      const {
        prompt: { details },
        params,
        session: { accountId },
      } = interactionDetails;

      const grant = new provider.Grant({
        accountId,
        clientId: params.client_id as string,
      });

      if (details.missingOIDCScope) {
        grant.addOIDCScope((details.missingOIDCScope as string[]).join(" "));
      }
      if (details.missingOIDCClaims) {
        grant.addOIDCClaims(details.missingOIDCClaims as string[]);
      }
      if (details.missingResourceScopes) {
        for (const [indicator, scopes] of Object.entries(
          details.missingResourceScopes
        )) {
          grant.addResourceScope(indicator, (scopes as string[]).join(" "));
        }
      }

      const grantId = await grant.save();

      const result = { consent: { grantId } };
      await provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: true,
      });
    } catch (err) {
      console.error("Consent error:", err);
      return res.status(500).send("Consent failed");
    }
  }
}
