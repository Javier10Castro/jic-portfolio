/**
 * sendBrief-upstash.js — Same handler as sendBrief.js, but enforces Redis-backed
 * rate limiting via UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.
 *
 * Why this file exists:
 *   sendBrief.js already auto-detects Upstash Redis at runtime. If you deploy
 *   with UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN set, it uses Redis
 *   sliding window automatically (falling back to in-memory token bucket).
 *
 *   This file exists as a Vercel routing target so you can use different rate
 *   limiting strategies on different endpoints:
 *
 *     /api/sendBrief          → in-memory token bucket (default)
 *     /api/sendBrief-upstash  → Redis sliding window (requires @upstash/redis)
 *
 * Setup:
 *   npm install @upstash/redis
 *   vercel env add UPSTASH_REDIS_REST_URL
 *   vercel env add UPSTASH_REDIS_REST_TOKEN
 *
 * Rate limits (same as sendBrief.js):
 *   - IP:  10 req/60s sliding window (Redis) or token bucket (memory)
 *   - Email: 1 req/60s dedup (in-memory, per-instance)
 *   - Honeypot: silent 200 response
 *   - Timing: reject if submittedAt < 3s from server time
 */

module.exports = require('./sendBrief');
