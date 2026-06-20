# Enterprise Identity & Security Platform — Phase 9.1.0

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Identity Manager                                  │
│                                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │
│  │   Authentication │  │   Authorization  │  │     Organizations         │  │
│  │  ┌─────────────┐│  │  ┌──────────────┐│  │  ┌──────────────────────┐│  │
│  │  │ JWT         ││  │  │ RBAC Engine  ││  │  │ Organization Manager ││  │
│  │  │ API Keys    ││  │  │ Permissions  ││  │  │ Tenant Isolation     ││  │
│  │  │ OAuth2/OIDC ││  │  │ Policy Engine││  │  │ Team Manager         ││  │
│  │  │ SAML 2.0    ││  │  │ Role Manager ││  │  │ Membership Manager   ││  │
│  │  │ MFA/TOTP    ││  │  │ Resource     ││  │  │ Invitation Manager   ││  │
│  │  │ Password    ││  │  │  Access      ││  │  └──────────────────────┘│  │
│  │  └─────────────┘│  │  └──────────────┘│  └───────────────────────────┘  │
│  └─────────────────┘  └──────────────────┘                                  │
│                                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │
│  │   Sessions      │  │   Directory      │  │      Security             │  │
│  │  ┌─────────────┐│  │  ┌──────────────┐│  │  ┌──────────────────────┐│  │
│  │  │ Session Mgmt││  │  │ SCIM 2.0     ││  │  │ Secret Manager       ││  │
│  │  │ Device Mgmt ││  │  │ LDAP         ││  │  │ Key Rotation         ││  │
│  │  │ Token Rotate││  │  │ Active Dir   ││  │  │ Encryption Service   ││  │
│  │  │ Login Hist  ││  │  │ Google Wkspc ││  │  │ Signature Service    ││  │
│  │  └─────────────┘│  │  │ Entra ID     ││  │  └──────────────────────┘│  │
│  │                 │  │  └──────────────┘│  └───────────────────────────┘  │
│  └─────────────────┘  └──────────────────┘                                  │
│                                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                                  │
│  │   Threats       │  │   Audit          │                                  │
│  │  ┌─────────────┐│  │  ┌──────────────┐│                                  │
│  │  │ Threat Det  ││  │  │ Audit Logger ││                                  │
│  │  │ Risk Scorer ││  │  │ Security Evts││                                  │
│  │  │ Anomaly Det ││  │  │ Audit Search ││                                  │
│  │  │ Acct Protect││  │  │ Compliance   ││                                  │
│  │  └─────────────┘│  │  └──────────────┘│                                  │
│  └─────────────────┘  └──────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Map

| Module | File | Purpose |
|---|---|---|
| **Identity Manager** | `identityManager.js` | Central orchestrator — authenticate, authorize, sessions, users |
| **JWT Provider** | `authentication/jwtProvider.js` | Access/refresh token generation, verification, decode |
| **API Key Provider** | `authentication/apiKeyProvider.js` | Key generation, hashing, validation, revocation |
| **OAuth Provider** | `authentication/oauthProvider.js` | OAuth2/OIDC — Google, GitHub, Microsoft login |
| **SAML Provider** | `authentication/samlProvider.js` | SAML 2.0 — provider registration, login URL, assertion processing |
| **MFA Provider** | `authentication/mfaProvider.js` | TOTP, recovery codes, enable/disable, verification |
| **Password Provider** | `authentication/passwordProvider.js` | PBKDF2 hashing, verification, strength validation |
| **Session Provider** | `authentication/sessionProvider.js` | Session tokens, idle timeout, expiry, revocation |
| **RBAC Engine** | `authorization/rbacEngine.js` | Role assignment, effective role resolution, hierarchy |
| **Permission Engine** | `authorization/permissionEngine.js` | Role-permission mapping, checkAccess with wildcards |
| **Policy Engine** | `authorization/policyEngine.js` | ABAC-ready policies, condition evaluation, attribute store |
| **Role Manager** | `authorization/roleManager.js` | Role CRUD, hierarchy, inherited permissions |
| **Resource Access** | `authorization/resourceAccess.js` | Per-resource grant/revoke, permission updates |
| **Org Manager** | `organizations/organizationManager.js` | Organization CRUD, plan management, domain lookup |
| **Tenant Isolation** | `organizations/tenantIsolation.js` | Multi-tenant data isolation strategies |
| **Team Manager** | `organizations/teamManager.js` | Team CRUD, membership, cross-org teams |
| **Membership Manager** | `organizations/membershipManager.js` | Org membership, role management, status |
| **Invitation Manager** | `organizations/invitationManager.js` | Invitation lifecycle, token-based accept/decline |
| **Audit Logger** | `audit/auditLogger.js` | Structured audit entries, query, stats aggregation |
| **Security Events** | `audit/securityEvents.js` | 19 event types, pub/sub, wildcard listeners, history |
| **Audit Search** | `audit/auditSearch.js` | Search, filter, pagination, saved searches, CSV export |
| **Compliance Exporter** | `audit/complianceExporter.js` | Compliance reports, daily breakdown, recommendations |
| **Session Manager** | `sessions/sessionManager.js` | Session lifecycle, idle timeout, bulk revocation |
| **Device Manager** | `sessions/deviceManager.js` | Device fingerprinting, trust management, stats |
| **Token Rotation** | `sessions/tokenRotation.js` | Automatic token rotation, reuse detection |
| **Login History** | `sessions/loginHistory.js` | Login attempt tracking, failure analysis, stats |
| **SCIM Provider** | `directory/scimProvider.js` | SCIM 2.0 — user/group CRUD, sync history |
| **LDAP Provider** | `directory/ldapProvider.js` | LDAP bind, user search, authentication |
| **Active Directory** | `directory/activeDirectoryProvider.js` | AD connect, UPN auth, group management |
| **Google Workspace** | `directory/googleWorkspaceProvider.js` | GW user sync, suspend/restore, group management |
| **Entra ID** | `directory/entraProvider.js` | Microsoft Entra ID, license assignment, group membership |
| **Secret Manager** | `security/secretManager.js` | AES-256-GCM encrypted secret storage, rotation, expiry |
| **Key Rotation** | `security/keyRotation.js` | Cryptographic key lifecycle, versioning, rotation |
| **Encryption Service** | `security/encryptionService.js` | Encrypt/decrypt, hashing, salt/key generation |
| **Signature Service** | `security/signatureService.js` | HMAC signing, RSA key pairs, timing-safe verification |
| **Threat Detector** | `threats/threatDetector.js` | 5 default rules, brute-force/IP/device/token detection |
| **Risk Scorer** | `threats/riskScorer.js` | Multi-factor risk scoring, history, entity summary |
| **Anomaly Detector** | `threats/anomalyDetector.js` | Z-score anomaly detection, baseline learning, batch detect |
| **Account Protection** | `threats/accountProtection.js` | Account lockout, password reuse, flag management |

## Authentication Flow

```
User → Login Credentials
    ↓
IdentityManager.authenticate()
    ├── method: 'password' → PasswordProvider.verify() → JWT access/refresh tokens
    ├── method: 'api_key'  → ApiKeyProvider.validateKey() → key metadata
    ├── method: 'oauth'    → OAuthProvider.exchangeCode() → user profile
    ├── method: 'saml'     → SamlProvider.processAssertion() → user
    ├── method: 'token'    → JwtProvider.verify() → user lookup
    ↓
On success:
    ├── LoginHistory.record()
    ├── SecurityEvents.emitUserLogin()
    ├── SessionManager.create()
    ├── JwtProvider.generateAccessToken()
    └── JwtProvider.generateRefreshToken()
```

## Authorization Flow

```
Request → IdentityManager.authorize(userId, resource, action, context)
    ↓
1. RbacEngine.getEffectiveRole() → resolve role (global → org → project → workspace)
2. PermissionEngine.checkAccess(role, resource, action) → wildcard/specific match
3. ResourceAccess.checkAccess(userId, resource, id, action) → per-resource grants
4. PolicyEngine.evaluate() → ABAC conditions
    ↓
Return { allowed: true/false, role, source }
```

## RBAC Model

| Role | Hierarchy | Permissions |
|---|---|---|
| Viewer | 10 | `read:project`, `read:workspace`, `read:organization` |
| Editor | 20 | Viewer + `write:project`, `write:workspace` |
| Admin | 30 | Editor + `delete:*`, `manage:members` |
| Owner | 40 | Admin + `manage:billing`, `manage:settings` |
| Super Admin | 50 | `*` (all) |

Role inheritance via parentId in RoleManager enables custom hierarchy.

## Organization Model

```
Organization
    ├── Teams (sub-groupings within org)
    ├── Members (users with roles: member/admin/owner)
    ├── Invitations (pending/expired/accepted/declined)
    └── Tenant Isolation Strategy
        ├── row — org_id filter on queries
        ├── schema — dedicated database schema
        ├── database — dedicated database
        └── shared — prefix-based isolation
```

## API Catalog

All routes under `/api/v1/security/`:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Authenticate with password, API key, OAuth, SAML, or token |
| POST | `/auth/logout` | Revoke session and emit logout event |
| POST | `/auth/refresh` | Exchange refresh token for new access token pair |
| POST | `/auth/mfa/verify` | Verify TOTP token and enable MFA |
| GET | `/me` | Get current user profile |
| GET | `/sessions` | List active sessions |
| DELETE | `/sessions/:id` | Revoke a session |
| GET | `/organizations` | List organizations |
| POST | `/organizations` | Create organization |
| PATCH | `/organizations/:id` | Update organization |
| GET | `/users` | List users |
| POST | `/users` | Create user |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| GET | `/roles` | List roles |
| POST | `/roles` | Create custom role |
| PATCH | `/roles/:id` | Update role |
| DELETE | `/roles/:id` | Delete custom role |
| GET | `/permissions` | List registered permissions |
| GET | `/audit` | Search audit log |
| GET | `/security/events` | Get security event history |
| GET | `/threats` | Get detected threats |
| POST | `/invitations` | Create invitation |
| POST | `/scim/sync` | Trigger SCIM sync |
| GET | `/report` | Generate security report |
| GET | `/health` | Engine health status |

## Security Report Example

```json
{
  "securityScore": 92,
  "riskLevel": "low",
  "activeUsers": 25,
  "activeSessions": 42,
  "organizations": 3,
  "failedLogins": 2,
  "mfaCoverage": 68,
  "threats": 1,
  "recommendations": [
    "Enable MFA for all users"
  ],
  "timestamp": 1718800000000
}
```

## MFA

- **TOTP**: RFC 6238-compliant, 30s window, configurable drift tolerance
- **Recovery Codes**: 8 one-time use codes on setup
- **WebAuthn**: Architecture-ready for passkey/FIDO2 integration

## Directory Sync

| Provider | Protocol | Features |
|---|---|---|
| SCIM 2.0 | REST | User/group CRUD, sync history |
| LDAP | Bind | User auth, search, group membership |
| Active Directory | UPN | Connect, auth, group management |
| Google Workspace | API | User sync, suspend/restore, groups |
| Microsoft Entra ID | Graph | User sync, license assignment, groups |

## Threat Detection

| Rule | Condition | Severity |
|---|---|---|
| Brute Force | 5+ failed logins in 5 min | High |
| Impossible Travel | 2+ distant logins in 1h | Critical |
| Suspicious IP | Private/reserved IP ranges | Medium |
| New Device | First login from unknown device | Low |
| Token Reuse | Attempt to use rotated token | Critical |

## Integration

The Security Platform integrates with existing systems via adapters (no modifications to existing engines):

- **Platform API**: Routes registered at `/api/v1/security/`
- **Control Plane**: Dashboard widgets for security metrics
- **Event Bus**: Security events emitted for cross-system correlation
- **Telemetry**: Login history, threat stats, audit entries
- **Cost Engine**: User counts for cost allocation
- **Cluster**: Session and auth for worker authentication
- **Workflow Engine**: Auth checks for workflow execution permissions
- **AI Router**: API key validation for provider access
- **Agents**: Role-based access for agent operations

## Example Usage

```js
const { IdentityManager } = require('./lib/security');

const im = new IdentityManager();

// Register user
const user = im.registerUser({ email: 'user@example.com', password: 'SecurePass1!' });

// Login
const auth = im.authenticate({ method: 'password', email: 'user@example.com', password: 'SecurePass1!' });
// → { success: true, accessToken, refreshToken, session }

// Assign role
im.rbac.assignRole(user.id, 'admin');

// Authorize
const result = im.authorize(user.id, 'project', 'write');
// → { allowed: true, role: 'admin' }

// Security report
const report = im.generateSecurityReport();
// → { securityScore, riskLevel, recommendations, ... }
```
