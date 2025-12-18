import { AUTH_CONFIG, STORAGE_KEYS } from "../config/auth";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "../utils/pkce";

interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string; // Optional - not always returned
  token_type: string;
  expires_in: number;
}

interface UserInfo {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
}

export class AuthService {
  /**
   * Initiate login - redirect to auth service
   */
  async login(): Promise<void> {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store code_verifier and state for later use
    sessionStorage.setItem(STORAGE_KEYS.codeVerifier, codeVerifier);
    sessionStorage.setItem(STORAGE_KEYS.state, state);

    // Build authorization URL
    const params = new URLSearchParams({
      response_type: "code",
      client_id: AUTH_CONFIG.clientId,
      redirect_uri: AUTH_CONFIG.redirectUri,
      scope: AUTH_CONFIG.scopes,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    const authUrl = `${AUTH_CONFIG.authServiceUrl}/auth?${params.toString()}`;
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback - exchange code for tokens
   */
  async handleCallback(code: string, state: string): Promise<boolean> {
    // Validate state
    const storedState = sessionStorage.getItem(STORAGE_KEYS.state);
    if (!storedState || storedState !== state) {
      console.error("Invalid state parameter");
      return false;
    }

    // Get code_verifier
    const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.codeVerifier);
    if (!codeVerifier) {
      console.error("No code_verifier found");
      return false;
    }

    // Prevent duplicate processing
    const processingKey = `processing_${code}`;
    if (sessionStorage.getItem(processingKey)) {
      console.log("Token exchange already in progress");
      return false;
    }
    sessionStorage.setItem(processingKey, "true");

    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code, codeVerifier);

      // Store tokens
      localStorage.setItem(STORAGE_KEYS.accessToken, tokens.access_token);
      localStorage.setItem(STORAGE_KEYS.idToken, tokens.id_token);
      if (tokens.refresh_token) {
        localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refresh_token);
      }

      // Get user info
      const userInfo = await this.getUserInfo(tokens.access_token);
      localStorage.setItem(STORAGE_KEYS.userInfo, JSON.stringify(userInfo));

      // Clean up session storage
      sessionStorage.removeItem(STORAGE_KEYS.codeVerifier);
      sessionStorage.removeItem(STORAGE_KEYS.state);
      sessionStorage.removeItem(processingKey);

      return true;
    } catch (error) {
      sessionStorage.removeItem(processingKey);
      console.error("Token exchange failed:", error);
      return false;
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(
    code: string,
    codeVerifier: string
  ): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: AUTH_CONFIG.redirectUri,
      client_id: AUTH_CONFIG.clientId,
      code_verifier: codeVerifier,
    });

    const response = await fetch(`${AUTH_CONFIG.authServiceUrl}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token exchange failed:", response.status, errorText);
      throw new Error("Token exchange failed");
    }

    const tokenData = await response.json();
    console.log("Token exchange successful:", tokenData);
    return tokenData;
  }

  /**
   * Get user info from auth service
   */
  private async getUserInfo(accessToken: string): Promise<UserInfo> {
    const response = await fetch(`${AUTH_CONFIG.authServiceUrl}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("UserInfo request failed:", response.status, errorText);
      throw new Error("Failed to get user info");
    }

    const userInfo = await response.json();
    console.log("UserInfo successful:", userInfo);
    return userInfo;
  }

  /**
   * Fetch and store user info using stored access token
   */
  async fetchUserInfo(): Promise<UserInfo> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error("No access token available");
    }

    const userInfo = await this.getUserInfo(accessToken);
    localStorage.setItem(STORAGE_KEYS.userInfo, JSON.stringify(userInfo));
    return userInfo;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem(STORAGE_KEYS.accessToken);
  }

  /**
   * Get stored user info
   */
  getUserInfoFromStorage(): UserInfo | null {
    const userInfoStr = localStorage.getItem(STORAGE_KEYS.userInfo);
    if (!userInfoStr) return null;
    return JSON.parse(userInfoStr);
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  }

  /**
   * Logout - clear all tokens
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
    localStorage.removeItem(STORAGE_KEYS.idToken);
    localStorage.removeItem(STORAGE_KEYS.refreshToken);
    localStorage.removeItem(STORAGE_KEYS.userInfo);
    sessionStorage.removeItem(STORAGE_KEYS.codeVerifier);
    sessionStorage.removeItem(STORAGE_KEYS.state);
  }
}

export const authService = new AuthService();
