const { getDetailedSnapshot, getSnapshot } = require('../lib/rate-limit');

module.exports = async (req, res) => {
  const detailed = getDetailedSnapshot();
  const basic = getSnapshot();

  const body = JSON.stringify({
    status: 'ok',
    timestamp: detailed.timestamp,
    instanceId: detailed.instanceId,
    ip: {
      currentEntries: basic.ipEntries,
      currentUsage: detailed.ip.entries,
      softLimit: detailed.ip.softLimit,
      hardLimit: detailed.ip.hardLimit,
      windowMs: detailed.ip.windowMs,
      oldestEntryAgeMs: detailed.ip.oldestEntryAgeMs,
      windowResetTime: detailed.ip.windowResetTime,
    },
    emailDedup: {
      cacheSize: basic.emailEntries,
      currentEntries: detailed.emailDedup.entries,
      limit: detailed.emailDedup.limit,
      windowMs: detailed.emailDedup.windowMs,
      oldestEntryAgeMs: detailed.emailDedup.oldestEntryAgeMs,
      windowResetTime: detailed.emailDedup.windowResetTime,
    },
    thresholds: {
      edgeSoftLimit: detailed.ip.softLimit,
      edgeHardLimit: detailed.ip.hardLimit,
      edgeWindowMs: detailed.ip.windowMs,
      emailDedupWindowMs: detailed.emailDedup.windowMs,
      emailDedupMaxPerWindow: detailed.emailDedup.limit,
    },
  });

  res.writeHead(200, { 'Content-Type': 'application/json' }).end(body);
};
