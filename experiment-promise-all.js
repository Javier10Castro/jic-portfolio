"use strict";

async function testPromiseAllOptimization() {
  const start = Date.now();
  
  console.log('\n=== Sequential (Current Implementation) ===');
  console.log('Testing sequential email sending (simulated)...');
  
  const seqStart = Date.now();
  const seqResults = [];
  
  for (let i = 0; i < 5; i++) {
    console.log('  Iteration ' + (i + 1) + ': Starting sequential emails...');
    
    const seqAdminStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 2000));
    const seqAdminTime = Date.now() - seqAdminStart;
    seqResults.push({ ok: true, elapsed: seqAdminTime, label: 'admin' });
    console.log('    Admin email completed: ' + seqAdminTime + 'ms');
    
    const seqClientStart = Date.now();
    await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 2000));
    const seqClientTime = Date.now() - seqClientStart;
    seqResults.push({ ok: true, elapsed: seqClientTime, label: 'client' });
    console.log('    Client email completed: ' + seqClientTime + 'ms');
  }
  
  const seqDuration = Date.now() - seqStart;
  const seqAdminTimes = seqResults.filter(r => r && r.label === 'admin').map(r => r.elapsed);
  const seqClientTimes = seqResults.filter(r => r && r.label === 'client').map(r => r.elapsed);
  
  console.log('\nSequential test results:');
  console.log('  Total time: ' + seqDuration + 'ms (' + (seqDuration / 1000).toFixed(1) + 's)');
  console.log('  Admin emails: ' + seqAdminTimes.length + ' (avg: ' + (seqAdminTimes.reduce((a, b) => a + b, 0) / seqAdminTimes.length).toFixed(0) + 'ms)');
  console.log('  Client emails: ' + seqClientTimes.length + ' (avg: ' + (seqClientTimes.reduce((a, b) => a + b, 0) / seqClientTimes.length).toFixed(0) + 'ms)');
  
  console.log('\n=== Promise.all() (Parallel) ===');
  console.log('Testing parallel email sending with Promise.all() (simulated)...');
  
  const parallelStart = Date.now();
  const parallelResults = [];
  
  for (let i = 0; i < 5; i++) {
    console.log('  Iteration ' + (i + 1) + ': Starting parallel emails...');
    
    const parallelStartTime = Date.now();
    await Promise.all([
      new Promise(resolve => setTimeout(() => {
        const elapsed = Date.now() - parallelStartTime;
        parallelResults.push({ ok: true, elapsed, label: 'admin' });
        console.log('    Admin email completed: ' + elapsed + 'ms');
        resolve();
      }, 4000 + Math.random() * 2000)),
      
      new Promise(resolve => setTimeout(() => {
        const elapsed = Date.now() - parallelStartTime;
        parallelResults.push({ ok: true, elapsed, label: 'client' });
        console.log('    Client email completed: ' + elapsed + 'ms');
        resolve();
      }, 4000 + Math.random() * 2000))
    ]);
  }
  
  const parallelDuration = Date.now() - parallelStart;
  const parallelAdminTimes = parallelResults.filter(r => r && r.label === 'admin').map(r => r.elapsed);
  const parallelClientTimes = parallelResults.filter(r => r && r.label === 'client').map(r => r.elapsed);
  
  console.log('\nParallel test results:');
  console.log('  Total time: ' + parallelDuration + 'ms (' + (parallelDuration / 1000).toFixed(1) + 's)');
  console.log('  Admin emails: ' + parallelAdminTimes.length + ' (avg: ' + (parallelAdminTimes.reduce((a, b) => a + b, 0) / parallelAdminTimes.length).toFixed(0) + 'ms)');
  console.log('  Client emails: ' + parallelClientTimes.length + ' (avg: ' + (parallelClientTimes.reduce((a, b) => a + b, 0) / parallelClientTimes.length).toFixed(0) + 'ms)');
  
  console.log('\n=== Results Comparison ===');
  const speedup = ((seqDuration - parallelDuration) / seqDuration * 100).toFixed(1);
  console.log('Time improvement: ' + speedup + '% faster');
  console.log('Sequential: ' + seqDuration + 'ms vs Parallel: ' + parallelDuration + 'ms');
  
  const seqTimeoutCount = seqAdminTimes.filter(t => t > 5000).length + seqClientTimes.filter(t => t > 5000).length;
  const parallelTimeoutCount = parallelAdminTimes.filter(t => t > 5000).length + parallelClientTimes.filter(t => t > 5000).length;
  
  console.log('\nTimeout Analysis (>5000ms):');
  console.log('Sequential: ' + seqTimeoutCount + ' timeouts');
  console.log('Parallel: ' + parallelTimeoutCount + ' timeouts');
  
  const seqSuccess = seqResults.filter(r => r && r.ok).length;
  const parallelSuccess = parallelResults.filter(r => r && r.ok).length;
  
  console.log('\nSuccess Rate:');
  console.log('Sequential: ' + seqSuccess + '/' + seqResults.length + ' (' + (seqSuccess/seqResults.length*100).toFixed(1) + '%)');
  console.log('Parallel: ' + parallelSuccess + '/' + parallelResults.length + ' (' + (parallelSuccess/parallelResults.length*100).toFixed(1) + '%)');
  
  return {
    sequential: {
      duration: seqDuration,
      adminTimes: seqAdminTimes,
      clientTimes: seqClientTimes,
      timeouts: seqTimeoutCount,
      success: seqSuccess
    },
    parallel: {
      duration: parallelDuration,
      adminTimes: parallelAdminTimes,
      clientTimes: parallelClientTimes,
      timeouts: parallelTimeoutCount,
      success: parallelSuccess
    }
  };
}

async function main() {
  try {
    console.log('=== Promise.all() vs Sequential Email Sending Optimization Test ===');
    console.log('Simulating Gmail SMTP timing based on documented behavior');
    console.log('Vercel Hobby limit: 10,000ms (10 seconds)');
    console.log('');
    
    const results = await testPromiseAllOptimization();
    
    console.log('\n=== FINAL SUMMARY ===');
    console.log('Experiment completed successfully!');
    console.log('Sequential total time:', results.sequential.duration, 'ms (' + (results.sequential.duration / 1000).toFixed(1) + 's)');
    console.log('Parallel total time:', results.parallel.duration, 'ms (' + (results.parallel.duration / 1000).toFixed(1) + 's)');
    var improvement = ((results.sequential.duration - results.parallel.duration) / results.sequential.duration * 100).toFixed(1);
    console.log('Improvement: ' + improvement + '%');
    console.log('Sequential timeouts:', results.sequential.timeouts);
    console.log('Parallel timeouts:', results.parallel.timeouts);
    
    console.log('\n=== KEY FINDINGS ===');
    console.log('Sequential approach: Both emails sent one after the other (serial)');
    console.log('Parallel approach: Both emails sent simultaneously using Promise.all()');
    console.log('');
    console.log('Vercel Hobby limit: 10,000ms (10 seconds)');
    console.log('Sequential duration:', (results.sequential.duration / 1000).toFixed(1), 'seconds');
    console.log('Parallel duration:', (results.parallel.duration / 1000).toFixed(1), 'seconds');
    
    const seqExceedsLimit = results.sequential.duration > 10000;
    const parallelExceedsLimit = results.parallel.duration > 10000;
    
    console.log('\n=== LIMIT ANALYSIS ===');
    if (seqExceedsLimit && parallelExceedsLimit) {
      console.log('❌ Sequential: EXCEEDS limit (' + (results.sequential.duration / 1000).toFixed(1) + 's > 10s)');
      console.log('❌ Parallel: EXCEEDS limit (' + (results.parallel.duration / 1000).toFixed(1) + 's > 10s)');
      console.log('');
      console.log('⚠️  Both approaches fail on Hobby plan');
      console.log('💡 Recommendation: Vercel Pro upgrade or alternative SMTP optimization');
    } else if (seqExceedsLimit && !parallelExceedsLimit) {
      console.log('❌ Sequential: EXCEEDS limit (' + (results.sequential.duration / 1000).toFixed(1) + 's > 10s)');
      console.log('✅ Parallel: WITHIN limit (' + (results.parallel.duration / 1000).toFixed(1) + 's < 10s)');
      console.log('');
      console.log('🎉 Promise.all() optimization enables Hobby plan compatibility!');
      console.log('💡 Recommendation: Implement parallel email sending to reduce execution time');
    } else {
      console.log('✅ Sequential: WITHIN limit (' + (results.sequential.duration / 1000).toFixed(1) + 's < 10s)');
      console.log('✅ Parallel: WITHIN limit (' + (results.parallel.duration / 1000).toFixed(1) + 's < 10s)');
      console.log('');
      console.log('📊 Both approaches work, but parallel provides better performance');
    }
    
  } catch (err) {
    console.error('Experiment failed:', err);
    process.exit(1);
  }
}

main();
