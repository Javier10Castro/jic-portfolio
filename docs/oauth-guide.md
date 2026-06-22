# OAuth Guide — Enterprise Integration Hub

## Supported Authentication Flows

| Flow | Type | Use Case | Providers |
|---|---|---|---|
| OAuth 2.0 Authorization Code | `oauth2` | Server-side web apps | GitHub, GitLab, Bitbucket, Netlify, Slack, Teams, Notion, Dropbox, Google |
| OAuth 2.0 with PKCE | `oauth-pkce` | Mobile/native apps | Google, any PKCE-capable provider |
| Personal Access Token | `pat` | CLI/automation | Vercel, Jira, Asana, Discord |
| API Key | `api-key` | Server-to-server | Linear, Trello |
| JWT Bearer Token | `jwt` | Service accounts | Custom providers |
| None | `none` | No auth needed | Internal/local integrations |

## OAuth 2.0 Authorization Code Flow

```
┌─────────┐          ┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│  Client  │          │  Integration│          │   Provider   │          │   OAuth     │
│  App     │          │  Hub        │          │   SDK        │          │   Server    │
└────┬─────┘          └──────┬──────┘          └──────┬───────┘          └──────┬──────┘
     │                       │                        │                        │
     │  connect(provider)    │                        │                        │
     │──────────────────────>│                        │                        │
     │                       │  generateAuthUrl()     │                        │
     │                       │───────────────────────>│                        │
     │                       │<── auth URL ───────────│                        │
     │  redirect to auth URL │                        │                        │
     │<──────────────────────│                        │                        │
     │                       │                        │                        │
     │  user authenticates   │                        │                        │
     │────────────────────────────────────────────────────────────────────────>│
     │                       │                        │                        │
     │  authorization code   │                        │                        │
     │<─────────────────────────────────────────────────────────────────────────│
     │                       │                        │                        │
     │  exchange code        │                        │                        │
     │──────────────────────>│                        │                        │
     │                       │  exchangeCode(code)    │                        │
     │                       │───────────────────────>│                        │
     │                       │                        │  POST /token           │
     │                       │                        │───────────────────────>│
     │                       │                        │<── access/refresh ─────│
     │                       │<── tokens ─────────────│                        │
     │  { success, instance }│                        │                        │
     │<──────────────────────│                        │                        │
```

### Authorization URL Parameters

```
https://provider.com/oauth/authorize?
  client_id=CLIENT_ID&
  redirect_uri=https://app.com/callback&
  response_type=code&
  scope=repo+user&
  state=random-state-string&
  access_type=offline&
  prompt=consent
```

### Token Exchange

```
POST /oauth/token
Content-Type: application/json

{
  "client_id": "CLIENT_ID",
  "client_secret": "CLIENT_SECRET",
  "code": "AUTHORIZATION_CODE",
  "redirect_uri": "https://app.com/callback",
  "grant_type": "authorization_code"
}

Response:
{
  "access_token": "gho_xxx",
  "token_type": "bearer",
  "scope": "repo,user",
  "refresh_token": "ghr_xxx",
  "expires_in": 3600
}
```

## PKCE Flow

```
┌─────────┐                    ┌─────────────┐                    ┌─────────────┐
│  Client  │                    │  Integration│                    │   OAuth     │
│  App     │                    │  Hub        │                    │   Server    │
└────┬─────┘                    └──────┬──────┘                    └──────┬──────┘
     │                                 │                                 │
     │  Generate code_verifier         │                                 │
     │  + code_challenge (SHA256)      │                                 │
     │                                 │                                 │
     │  generateAuthUrl(pkce=true)     │                                 │
     │────────────────────────────────>│                                 │
     │<── auth URL with challenge ─────│                                 │
     │                                 │                                 │
     │  Redirect with code_challenge   │                                 │
     │──────────────────────────────────────────────────────────────────>│
     │                                 │                                 │
     │  Authorization code             │                                 │
     │<───────────────────────────────────────────────────────────────────│
     │                                 │                                 │
     │  exchangeCode(code, verifier)   │                                 │
     │────────────────────────────────>│                                 │
     │                                 │  POST /token + code_verifier   │
     │                                 │────────────────────────────────>│
     │                                 │<── tokens ─────────────────────│
     │<── tokens ──────────────────────│                                 │
```

**Advantages**: No client_secret required; protects against authorization code interception.

### PKCE Parameters

| Parameter | Value |
|---|---|
| `code_challenge_method` | `S256` |
| `code_challenge` | Base64URL(SHA256(code_verifier)) |
| `code_verifier` | Random 43-128 character string |

## Provider-Specific OAuth Configs

### GitHub

```
authorizationUrl: https://github.com/login/oauth/authorize
tokenUrl: https://github.com/login/oauth/access_token
scopes: repo, user, admin:repo_hook
authType: oauth2
```

### GitLab

```
authorizationUrl: https://gitlab.com/oauth/authorize
tokenUrl: https://gitlab.com/oauth/token
scopes: api, read_user, read_repository
authType: oauth2
```

### Google

```
authorizationUrl: https://accounts.google.com/o/oauth2/v2/auth
tokenUrl: https://oauth2.googleapis.com/token
scopes: openid, profile, email, https://www.googleapis.com/auth/drive
authType: oauth2 (supports PKCE)
```

### Slack

```
authorizationUrl: https://slack.com/oauth/v2/authorize
tokenUrl: https://slack.com/api/oauth.v2.access
scopes: channels:read, chat:write, users:read
authType: oauth2
```

### Notion

```
authorizationUrl: https://api.notion.com/v1/oauth/authorize
tokenUrl: https://api.notion.com/v1/oauth/token
scopes: (Notion uses workspace-level integration tokens)
authType: oauth2
```

### Dropbox

```
authorizationUrl: https://www.dropbox.com/oauth2/authorize
tokenUrl: https://api.dropboxapi.com/oauth2/token
scopes: files.read, files.write, sharing.read
authType: oauth2
```

### PAT Providers

| Provider | Header | Format |
|---|---|---|
| Vercel | `Authorization: Bearer <token>` | `vcc_xxx` or personal token |
| Jira | `Authorization: Bearer <token>` | Base64-encoded email:token |
| Asana | `Authorization: Bearer <token>` | `1/xxxxx` personal access token |
| Discord | `Authorization: Bot <token>` | Bot token |

### API Key Providers

| Provider | Header | Format |
|---|---|---|
| Linear | `Authorization: <apiKey>` | `lin-api-xxxx` |
| Trello | `key=<apiKey>&token=<token>` | API key + member token |

## Token Refresh Flow

```
┌──────────┐          ┌─────────────┐          ┌────────────┐
│  Manager  │          │  Sync/Worker│          │  Provider  │
└─────┬─────┘          └──────┬──────┘          └──────┬─────┘
      │                       │                        │
      │  API call             │                        │
      │──────────────────────>│                        │
      │                       │  request               │
      │                       │───────────────────────>│
      │                       │  401 Unauthorized      │
      │                       │<───────────────────────│
      │                       │                        │
      │  token expired event  │                        │
      │<──────────────────────│                        │
      │                       │                        │
      │  refreshToken(old)    │                        │
      │───────────────────────│───────────────────────>│
      │                       │                        │
      │  emit TOKEN_EXPIRED   │  new access token      │
      │<──────────────────────│<───────────────────────│
      │                       │                        │
      │  retry request        │                        │
      │──────────────────────>│                        │
      │                       │  request + new token   │
      │                       │───────────────────────>│
      │                       │  200 OK                │
      │                       │<───────────────────────│
```

### Token Refresh Implementation

```js
async function refreshAccessToken(provider) {
  const refreshToken = secrets.get(provider, 'refresh_token');
  if (!refreshToken) {
    return { success: false, error: 'No refresh token available' };
  }

  const oauth = providers[provider].oauth;
  const result = await oauth.refreshToken(refreshToken);

  if (result.success) {
    secrets.store(provider, 'access_token', result.data.access_token);
    secrets.store(provider, 'refresh_token', result.data.refresh_token);
    events.emit(EVENTS.TOKEN_REFRESHED, { provider });
    return { success: true };
  }

  events.emit(EVENTS.TOKEN_EXPIRED, { provider });
  return { success: false, error: 'Refresh failed' };
}
```

## Security Best Practices

1. **Never store client_secret in client-side code** — use server-side token exchange
2. **Validate redirect_uri** — always whitelist exact callback URLs
3. **Use state parameter** — prevent CSRF on OAuth callback
4. **PKCE for mobile/native** — eliminates need for client_secret
5. **Rotate refresh tokens** — issue new refresh token on each refresh
6. **Encrypt stored tokens** — `IntegrationSecrets` uses base64 encoding
7. **Short-lived access tokens** — default 1 hour; use refresh flow
8. **Audit all auth events** — every connect/disconnect logged
9. **Scoped permissions** — request minimum required scopes
10. **Revoke on disconnect** — invalidate tokens when integration is removed

## Code Examples

### OAuth2 with Google

```js
const { GoogleOAuth } = require('../lib/integrations/providers/google/GoogleOAuth');

const oauth = new GoogleOAuth({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'https://app.com/oauth/callback'
});

const authUrl = oauth.generateAuthUrl('https://app.com/oauth/callback', [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents'
]);
console.log('Redirect user to:', authUrl.url);

const tokens = await oauth.exchangeCode('received-auth-code', 'https://app.com/oauth/callback');
console.log('Access:', tokens.data.access_token);
```

### PAT Authentication

```js
const { VercelProvider } = require('../lib/integrations/providers/vercel/VercelProvider');

const vercel = new VercelProvider({ token: 'vcc_xxx' });
const result = await vercel.connect();
if (result.success) {
  const projects = await new (require('../lib/integrations/providers/vercel/Projects'))(vercel).list();
  console.log('Projects:', projects.data);
}
```

### API Key Authentication

```js
const { LinearProvider } = require('../lib/integrations/providers/linear/LinearProvider');

const linear = new LinearProvider({ apiKey: 'lin-api-xxx' });
await linear.connect();
const teams = await linear.listTeams();
console.log('Teams:', teams.data);
```

### OAuth with Plugin SDK

```js
const { Plugin } = require('../lib/plugin-sdk');
const plugin = new Plugin({ id: 'my-integration', name: 'My Integration', version: '1.0.0' });

plugin.registerOAuthProvider('google', {
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  scopes: ['openid', 'profile', 'email']
});

const oauth = plugin.getOAuthProviders().google;
const authResult = oauth.authorize('https://app.com/callback');
console.log('Auth URL:', authResult.url);
```
