const { BaseIntegration } = require('./BaseIntegration');

const providers = {};

function registerProviderClass(id, cls) {
  providers[id] = cls;
}

function getProvider(id) {
  return providers[id] || null;
}

function getProvidersList() {
  return Object.entries(providers).map(([id, cls]) => {
    const info = typeof cls.getProviderInfo === 'function' ? cls.getProviderInfo() : (cls.prototype ? { name: id, type: 'unknown', authType: 'unknown' } : { name: id, type: 'unknown', authType: 'unknown' });
    return { id, name: info.name || id, type: info.type || 'unknown', authType: info.authType || 'unknown', version: info.version || '1.0.0' };
  });
}

function loadProviders() {
  if (Object.keys(providers).length > 0) return;
  const { GithubProvider } = require('./github/GithubProvider');
  const { GitlabProvider } = require('./gitlab/GitlabProvider');
  const { BitbucketProvider } = require('./bitbucket/BitbucketProvider');
  const { VercelProvider } = require('./vercel/VercelProvider');
  const { NetlifyProvider } = require('./netlify/NetlifyProvider');
  const { SlackProvider } = require('./slack/SlackProvider');
  const { TeamsProvider } = require('./teams/TeamsProvider');
  const { DiscordProvider } = require('./discord/DiscordProvider');
  const { NotionProvider } = require('./notion/NotionProvider');
  const { JiraProvider } = require('./jira/JiraProvider');
  const { LinearProvider } = require('./linear/LinearProvider');
  const { TrelloProvider } = require('./trello/TrelloProvider');
  const { AsanaProvider } = require('./asana/AsanaProvider');
  const { DropboxProvider } = require('./dropbox/DropboxProvider');
  providers.github = GithubProvider;
  providers.gitlab = GitlabProvider;
  providers.bitbucket = BitbucketProvider;
  providers.vercel = VercelProvider;
  providers.netlify = NetlifyProvider;
  providers.slack = SlackProvider;
  providers['microsoft-teams'] = TeamsProvider;
  providers.discord = DiscordProvider;
  providers.notion = NotionProvider;
  providers.jira = JiraProvider;
  providers.linear = LinearProvider;
  providers.trello = TrelloProvider;
  providers.asana = AsanaProvider;
  providers.dropbox = DropboxProvider;
}

loadProviders();

module.exports = { BaseIntegration, getProvider, getProvidersList, registerProviderClass };
