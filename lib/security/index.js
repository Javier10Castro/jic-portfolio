const { IdentityManager } = require('./identityManager');
const { JwtProvider } = require('./authentication/jwtProvider');
const { ApiKeyProvider } = require('./authentication/apiKeyProvider');
const { OAuthProvider } = require('./authentication/oauthProvider');
const { SamlProvider } = require('./authentication/samlProvider');
const { MfaProvider } = require('./authentication/mfaProvider');
const { PasswordProvider } = require('./authentication/passwordProvider');
const { SessionProvider } = require('./authentication/sessionProvider');
const { RbacEngine } = require('./authorization/rbacEngine');
const { PermissionEngine } = require('./authorization/permissionEngine');
const { PolicyEngine } = require('./authorization/policyEngine');
const { RoleManager } = require('./authorization/roleManager');
const { ResourceAccess } = require('./authorization/resourceAccess');
const { OrganizationManager } = require('./organizations/organizationManager');
const { TenantIsolation } = require('./organizations/tenantIsolation');
const { TeamManager } = require('./organizations/teamManager');
const { MembershipManager } = require('./organizations/membershipManager');
const { InvitationManager } = require('./organizations/invitationManager');
const { AuditLogger } = require('./audit/auditLogger');
const { SecurityEvents, EVENT_TYPES } = require('./audit/securityEvents');
const { AuditSearch } = require('./audit/auditSearch');
const { ComplianceExporter } = require('./audit/complianceExporter');
const { SessionManager } = require('./sessions/sessionManager');
const { DeviceManager } = require('./sessions/deviceManager');
const { TokenRotation } = require('./sessions/tokenRotation');
const { LoginHistory } = require('./sessions/loginHistory');
const { ScimProvider } = require('./directory/scimProvider');
const { LdapProvider } = require('./directory/ldapProvider');
const { ActiveDirectoryProvider } = require('./directory/activeDirectoryProvider');
const { GoogleWorkspaceProvider } = require('./directory/googleWorkspaceProvider');
const { EntraProvider } = require('./directory/entraProvider');
const { SecretManager } = require('./security/secretManager');
const { KeyRotation } = require('./security/keyRotation');
const { EncryptionService } = require('./security/encryptionService');
const { SignatureService } = require('./security/signatureService');
const { ThreatDetector } = require('./threats/threatDetector');
const { RiskScorer } = require('./threats/riskScorer');
const { AnomalyDetector } = require('./threats/anomalyDetector');
const { AccountProtection } = require('./threats/accountProtection');

let _defaultEngine = null;

function getDefaultEngine() {
  if (!_defaultEngine) _defaultEngine = new IdentityManager();
  return _defaultEngine;
}

function resetDefaultEngine() {
  _defaultEngine = null;
}

module.exports = {
  IdentityManager,
  getDefaultEngine,
  resetDefaultEngine,
  JwtProvider,
  ApiKeyProvider,
  OAuthProvider,
  SamlProvider,
  MfaProvider,
  PasswordProvider,
  SessionProvider,
  RbacEngine,
  PermissionEngine,
  PolicyEngine,
  RoleManager,
  ResourceAccess,
  OrganizationManager,
  TenantIsolation,
  TeamManager,
  MembershipManager,
  InvitationManager,
  AuditLogger,
  SecurityEvents,
  EVENT_TYPES,
  AuditSearch,
  ComplianceExporter,
  SessionManager,
  DeviceManager,
  TokenRotation,
  LoginHistory,
  ScimProvider,
  LdapProvider,
  ActiveDirectoryProvider,
  GoogleWorkspaceProvider,
  EntraProvider,
  SecretManager,
  KeyRotation,
  EncryptionService,
  SignatureService,
  ThreatDetector,
  RiskScorer,
  AnomalyDetector,
  AccountProtection
};
