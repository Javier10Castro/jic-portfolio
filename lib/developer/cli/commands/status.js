function handler(args, platform) {
  if (platform) {
    const s = platform.getStatus();
    return { success: true, output: `SDKs: ${s.sdks}\nClients: ${s.clients}\nOpenAPI: ${s.openApiVersions}\nSchemas: ${s.schemas}\nAPI Calls: ${s.analytics ? s.analytics.totalCalls : 0}` };
  }
  return { success: true, output: 'Platform status: OK' };
}
module.exports = { handler };
