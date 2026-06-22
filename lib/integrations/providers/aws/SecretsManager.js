class SecretsManager {
  constructor(config = {}) {
    this.config = config;
    this.region = config.region || 'us-east-1';
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;
    this.secrets = {};
  }

  async createSecret(name, value) {
    this.secrets[name] = value;
    return {
      success: true,
      data: {
        Name: name,
        VersionId: `version-${Date.now().toString(36)}`,
        ARN: `arn:aws:secretsmanager:${this.region}:account-id:secret:${name}`,
        CreatedDate: new Date(),
      },
    };
  }

  async getSecret(name) {
    const value = this.secrets[name] || 'mock-secret-value';
    return {
      success: true,
      data: {
        Name: name,
        SecretString: typeof value === 'string' ? value : JSON.stringify(value),
        VersionId: 'version-1',
        ARN: `arn:aws:secretsmanager:${this.region}:account-id:secret:${name}`,
        CreatedDate: new Date(),
        LastChangedDate: new Date(),
        SecretVersionsToStages: { 'version-1': ['AWSCURRENT'] },
      },
    };
  }

  async updateSecret(name, value) {
    this.secrets[name] = value;
    return {
      success: true,
      data: {
        Name: name,
        VersionId: `version-${Date.now().toString(36)}`,
        ARN: `arn:aws:secretsmanager:${this.region}:account-id:secret:${name}`,
      },
    };
  }

  async deleteSecret(name) {
    delete this.secrets[name];
    return {
      success: true,
      data: {
        Name: name,
        DeletionDate: new Date(),
      },
    };
  }

  async listSecrets() {
    return {
      success: true,
      data: {
        SecretList: [
          { Name: 'db-credentials', ARN: `arn:aws:secretsmanager:${this.region}:account-id:secret:db-credentials`, LastChangedDate: new Date(), LastAccessedDate: new Date(), RotationEnabled: false },
          { Name: 'api-keys', ARN: `arn:aws:secretsmanager:${this.region}:account-id:secret:api-keys`, LastChangedDate: new Date(), LastAccessedDate: new Date(), RotationEnabled: true, RotationRules: { AutomaticallyAfterDays: 90 } },
        ],
      },
    };
  }
}

module.exports = { SecretsManager };
