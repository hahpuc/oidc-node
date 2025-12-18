// Configuration for OAuth/OpenID Connect
export const AUTH_CONFIG = {
  authServiceUrl: "http://localhost:3000",
  clientId: "admin_client",
  redirectUri: "http://localhost:4000/callback",
  scopes: "openid email profile offline_access",
};

// Storage keys
export const STORAGE_KEYS = {
  codeVerifier: "pkce_code_verifier",
  state: "oauth_state",
  accessToken: "access_token",
  idToken: "id_token",
  refreshToken: "refresh_token",
  userInfo: "user_info",
};
