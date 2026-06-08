# Architecture — Web Portfolio + Brief Maestro

## System Overview

Dual-purpose Vercel-deployed site combining a personal portfolio (Javier Ibrahim, Full Stack Developer) with an interactive web discovery tool (Brief Maestro). Both frontends are vanilla HTML/CSS/JS with no build step. Backend consists of two Vercel Serverless Functions that handle form submissions, email delivery via Gmail SMTP, and server-side PDF generation.

## Project Objective

Lead generation and client onboarding through contact forms, AI-powered brief collection, automated email delivery, and PDF brief generation.

## General Architecture

```
User Browser
    │
    ├── index.html ────── POST /api/sendContact ──► Vercel Function ──► Gmail SMTP
    │                                                                    │
    └── brief-maestro.html ── POST /api/sendBrief ──► Vercel Function ──┤
                                                                        ├── Admin: GMAIL_USER (with PDF)
                                                                        └── Client: [email, GMAIL_USER]
```

### Frontend

- **Zero frameworks**: Vanilla HTML, CSS, JavaScript — no build step, no bundler, no TypeScript.
- **Typography**: Google Fonts (Inter + Space Grotesk).
- **Icons**: Inline SVG — no icon library.
- **Styling**: CSS Custom Properties with native dark theme (no toggle). Mobile-first with breakpoints at 900px and 600px.
- **Scroll animations**: `.reveal` class + `IntersectionObserver`, with staggered `.anim-0` through `.anim-4` utilities.
- **Custom cursor**: `#cursor` and `#cursor-ring` elements.
- **Background**: Canvas-based particle network animation.
- **localStorage**: Brief auto-save under key `briefMaestro`, language under `briefMaestroLang`. `currentStep` is not persisted.

### Backend (Vercel Functions)

Two endpoints in `api/`, both deployed as Vercel Serverless Functions (Node.js runtime):

| Endpoint | File | Purpose |
|---|---|---|
| `POST /api/sendContact` | `api/sendContact.js` | Portfolio contact form submission |
| `POST /api/sendBrief` | `api/sendBrief.js` | Brief Maestro submission with PDF attachment |

Both functions use:
- `nodemailer@^8.0.10` with Gmail SMTP (`service: 'gmail'`)
- `transporter.verify()` for SMTP connection validation before sending
- `escapeHTML()` on all user-provided values
- Timezone: `America/Tijuana`

## Contact Form Flow (index.html → /api/sendContact)

1. User fills form on `index.html` (name, email, company, project, message)
2. Form includes hidden honeypot field (`<input name="bot" style="display:none">`) — frontend checks and skips fetch if filled
3. `fetch()` POST to `/api/sendContact` with JSON body `{ name, email, company?, project?, message, lang }`
4. Vercel Function validates required fields (`name`, `email`, `message`)
5. Creates nodemailer transporter with `GMAIL_USER` / `GMAIL_APP_PASSWORD`
6. Sends **2 emails**:
   - **Admin notification**: `to: GMAIL_USER`, `replyTo: email` — contains message detail as `type: 'admin'`
   - **Client confirmation**: `to: [email, GMAIL_USER]`, `replyTo: GMAIL_USER` — contains same data as `type: 'client'`
7. Returns `{ success: true }` on success, `{ error: string }` on failure

## Brief Maestro Flow (brief-maestro.html → /api/sendBrief)

1. User completes 14-section strategic questionnaire on `brief-maestro.html`
2. Form data auto-saved to `localStorage` key `briefMaestro` on each input
3. On submission, `fetch()` POST to `/api/sendBrief` with JSON body `{ name, email, company?, phone?, prompt, lang, formData }`
4. Vercel Function validates required fields (`name`, `email`)
5. Generates PDF via PDFKit from the `prompt` string
6. Creates nodemailer transporter with `GMAIL_USER` / `GMAIL_APP_PASSWORD`
7. Sends **2 emails**:
   - **Admin notification**: `to: GMAIL_USER`, `replyTo: email` — includes visual summary of form data + PDF attachment (`brief-{biz_name}.pdf`)
   - **Client confirmation**: `to: [email, GMAIL_USER]`, `replyTo: GMAIL_USER` — warm conversational tone with next steps timeline
8. Returns `{ success: true }` on success, `{ error: string }` on failure

## Email Architecture

### Shared Characteristics

- Built with inline styles and table-based layout for email client compatibility
- `bgcolor` fallback for Outlook (which ignores `background: linear-gradient`)
- Dark mode support via `@media (prefers-color-scheme: dark)` with class-based selectors and `!important`
- Gradient header (`#00D4FF → #00FFC8`) with "JIC" logo mark
- Responsive max-width 600px
- `escapeHTML()` on all user-supplied values
- Timestamp formatted with `America/Tijuana` timezone

### Email 1 — Admin Notification

| Property | Contact | Brief |
|---|---|---|
| `from` | `"Javier Ibrahim — Portfolio"` | `"Build a Brief"` |
| `to` | `GMAIL_USER` | `GMAIL_USER` |
| `replyTo` | `email` (client) | `email` (client) |
| Template | `buildContactHTML(data, 'admin')` | `buildEmailHTML(data)` |
| Attachment | None | PDF (`brief-{biz_name}.pdf`) |

### Email 2 — Client Confirmation

| Property | Contact | Brief |
|---|---|---|
| `from` | `"Javier Ibrahim"` | `"Build a Brief"` |
| `to` | `[email, GMAIL_USER]` | `[email, GMAIL_USER]` |
| `replyTo` | `GMAIL_USER` | `GMAIL_USER` |
| Template | `buildContactHTML(data, 'client')` | `buildClientEmailHTML(data)` |
| Attachment | None | None |

**Why `to: [email, GMAIL_USER]` instead of CC**: Gmail SMTP suppresses CC when sender and CC are the same address. Using both recipients in `to:` ensures reliable delivery to both.

## PDF Generation

- Library: `pdfkit@^0.18.0`
- Size: A4, 50px margins
- Content: Full master prompt in monospace (Courier), title "Prompt Maestro", client name/company
- Filename: `brief-{business_name}.pdf` — business name sanitized with `[^a-zA-Z0-9\u00C0-\u024F]`
- Generated server-side in `sendBrief.js` via `generatePDF()` Promise-based function
- Attached to admin notification email only — not sent to client
- Never generated on the client

## Environment Variables

| Variable | Purpose | Used in |
|---|---|---|
| `GMAIL_USER` | Gmail address for SMTP authentication | `sendContact.js:14`, `sendBrief.js:15` |
| `GMAIL_APP_PASSWORD` | Gmail app password | `sendContact.js:15`, `sendBrief.js:16` |

Both must be set in Vercel Dashboard. Never exposed to frontend code. Never hardcoded.

## Project Structure

```
/
├── api/
│   ├── sendBrief.js          # Vercel Function: brief submission (2 emails + PDF)
│   └── sendContact.js        # Vercel Function: contact form (2 emails)
├── .vercel/                   # Vercel cache (auto-generated, ignored by git)
├── node_modules/              # Dependencies (ignored by git)
├── index.html                 # Portfolio landing page
├── brief-maestro.html         # Brief Maestro tool (14 sections)
├── test-data.json             # Test fixture (Salmos Café)
├── icon.ico                   # Favicon
├── package.json               # Project metadata + dependencies
├── package-lock.json          # npm lockfile
├── AGENTS.md                  # Project documentation for AI agents
├── ARCHITECTURE.md            # This file
├── .gitignore                 # Git ignore rules
├── .gitattributes             # Git line ending normalization
└── .git                       # Git repository (initialized)
```

## Deployment Flow (Vercel)

1. Code pushed to GitHub repository
2. Vercel imports from GitHub (or deploys via `vercel --prod`)
3. Vercel detects `api/` directory and deploys each file as a Serverless Function
4. Environment variables (`GMAIL_USER`, `GMAIL_APP_PASSWORD`) set in Vercel Dashboard
5. Static files (`index.html`, `brief-maestro.html`, `test-data.json`, `icon.ico`) served from root
6. No `vercel.json` configuration file — uses Vercel defaults
7. No build step required (pure static + serverless)

## Error Handling

### API Routes

| Scenario | HTTP Status | Response |
|---|---|---|
| Method not POST | 405 | `{ error: "Method Not Allowed" }` |
| Missing required fields | 400 | `{ error: "..." }` |
| Missing env vars | 500 | `{ error: "Email service misconfigured" }` |
| SMTP failure | 502 | `{ error: "Failed to send email" }` |

Both functions log errors to `console.error` (visible in Vercel Dashboard → Deployment → Functions). No retry logic, no queue, no fallback transport.

### Frontend

- Contact form has honeypot (bot check) that prevents fetch if filled
- Brief Maestro has no honeypot
- Both forms display success overlay on `{ success: true }` response
- Both forms show alert on `{ error }` response
- No rate limiting or captcha on either endpoint

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Vanilla HTML/CSS/JS | No build step, zero dependencies, direct deployment |
| Vercel Functions (not Express server) | Serverless, auto-scaling, native Node.js runtime |
| Gmail SMTP via nodemailer | No third-party email service needed; Gmail is free |
| PDFKit server-side | Client-side PDF generation cannot attach to email |
| `to: [email, GMAIL_USER]` | Reliable delivery; Gmail suppresses CC when sender == CC |
| Two separate API functions | Cleaner validation, different payload structures |
| `America/Tijuana` timezone | Consistent timestamps regardless of server location |
| `escapeHTML()` on all output | XSS prevention for email content |
| `transporter.verify()` before send | Fail fast if SMTP credentials are invalid |

## Current System Risks

1. **No rate limiting**: Both endpoints are publicly accessible without throttling — susceptible to abuse
2. **No captcha**: Brief Maestro form lacks honeypot (index.html has one)
3. **Gmail App Password expiration**: Credentials can expire silently, causing 502 errors
4. **No retry logic**: Failed email sends are not retried
5. **No logging infrastructure**: Only `console.error` — no structured logging or monitoring
6. **No input size limits**: Prompt/message fields have no server-side size validation
7. **No CORS configuration**: Vercel Functions accept requests from any origin by default
8. **No CI/CD**: No automated testing or deployment pipeline
9. **Hardcoded SMTP service**: `service: 'gmail'` — switching providers would require code changes
