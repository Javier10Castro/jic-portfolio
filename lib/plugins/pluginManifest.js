const HOOKS = {
  BEFORE_GENERATION: 'beforeGeneration',
  AFTER_GENERATION: 'afterGeneration',
  BEFORE_DEPLOYMENT: 'beforeDeployment',
  AFTER_DEPLOYMENT: 'afterDeployment',
  BEFORE_WORKFLOW: 'beforeWorkflow',
  AFTER_WORKFLOW: 'afterWorkflow',
  BEFORE_BILLING: 'beforeBilling',
  AFTER_BILLING: 'afterBilling',
  BEFORE_AUTHENTICATION: 'beforeAuthentication',
  AFTER_AUTHENTICATION: 'afterAuthentication',
  BEFORE_REMEDIATION: 'beforeRemediation',
  AFTER_REMEDIATION: 'afterRemediation',
  SYSTEM_STARTUP: 'systemStartup',
  SYSTEM_SHUTDOWN: 'systemShutdown',
  BEFORE_COST: 'beforeCost',
  AFTER_COST: 'afterCost',
  BEFORE_SECURITY: 'beforeSecurity',
  AFTER_SECURITY: 'afterSecurity',
  BEFORE_PLUGIN_LOAD: 'beforePluginLoad',
  AFTER_PLUGIN_LOAD: 'afterPluginLoad'
};

module.exports = { HOOKS };
