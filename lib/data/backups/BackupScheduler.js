class BackupScheduler {
  constructor() { this._jobs = {}; }
  schedule(name, cronExpression, backupFn) { this._jobs[name] = { cron: cronExpression, backupFn, scheduledAt: Date.now(), lastRun: null, nextRun: Date.now() + 3600000 }; return { success: true }; }
  cancel(name) { delete this._jobs[name]; return { success: true }; }
  run(name) { const job = this._jobs[name]; if (!job) return { success: false, error: 'Job not found' }; job.lastRun = Date.now(); job.nextRun = Date.now() + 3600000; return { success: true, result: job.backupFn ? job.backupFn() : {} }; }
  list() { return Object.entries(this._jobs).map(([name, j]) => ({ name, lastRun: j.lastRun, nextRun: j.nextRun })); }
  count() { return Object.keys(this._jobs).length; }
  clear() { this._jobs = {}; }
}
module.exports = { BackupScheduler };
