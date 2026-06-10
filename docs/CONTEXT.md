# Web Portfolio API — System Context

## Overview

This project is a serverless API deployed on Vercel that powers contact forms and brief submission flows for a portfolio website.

It includes:
- Contact form submission (`/api/sendContact`)
- Brief request system (`/api/sendBrief`)
- Email delivery via SMTP (Nodemailer)
- Queue-based async processing
- Multi-layer rate limiting system

---

## Architecture

### 1. Request Flow

Client → API Route → Body Parser → Validation → Rate Limit → Queue → Email Worker

---

### 2. Body Parsing Layer

All requests go through:
