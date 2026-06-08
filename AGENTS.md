# AGENTS.md — Web Portfolio + Brief Maestro

## Project Overview

Dual-purpose site deployed on Vercel combining a professional portfolio and an interactive web discovery tool.

### Portfolio (`index.html`)
- Personal portfolio for Javier Ibrahim (Full Stack Developer)
- Sections: services, projects, testimonials, contact form
- Contact form submits to `/api/sendContact`

### Brief Maestro (`brief-maestro.html`)
- 14-section strategic questionnaire for defining a web project
- Generates a master prompt (ready for Claude AI)
- Auto-saves progress to `localStorage`
- Submits to `/api/sendBrief`
- Generates server-side PDF attached to admin email notification

### Primary Objective
Lead generation and client onboarding through contact forms, AI-powered brief collection, automated email delivery, and PDF brief generation.

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | Vanilla HTML/CSS/JS | — | Zero frameworks, no build step |
| Typography | Google Fonts | Inter + Space Grotesk | Design system |
| Icons | Inline SVG | — | No icon library |
| Runtime | Node.js | 22.11.0 | Serverless functions |
| Hosting | Vercel | — | Platform & deployment |
| Email | nodemailer | ^8.0.10 | Gmail SMTP transport |
| PDF | pdfkit | ^0.18.0 | Server-side prompt PDF |
| Storage | localStorage | — | Brief auto-save |
| Styling | CSS Custom Properties | — | Dark theme, design system |

---

## Project Structure

```
/
├── api/
│   ├── sendBrief.js          # Vercel Function: brief submission (2 emails + PDF)
│   └── sendContact.js        # Vercel Function: contact form (2 emails)
├── .vercel/                   # Vercel cache (auto-generated, ignore)
├── node_modules/              # Dependencies (npm install)
├── index.html                 # Portfolio landing page
├── brief-maestro.html         # Brief Maestro tool (14 sections)
├── test-data.json             # Test fixture (Salmos Café)
├── icon.ico                   # Favicon
├── package.json               # Project metadata + dependencies
├── package-lock.json          # npm lockfile
├── AGENTS.md                  # This file
└── .gitignore                 # Ignores .vercel
```

---

## Code Conventions

### Naming

| Element | Convention | Examples |
|---|---|---|
| CSS classes | `kebab-case` | `.nav-logo`, `.btn-primary`, `.hero-eyebrow` |
| CSS custom properties | `--kebab-case` | `--bg`, `--accent`, `--font-sans` |
| HTML IDs | `kebab-case` or `snake_case` | `inp-name`, `err-email`, `cur-step-name` |
| JS variables | `camelCase` | `currentStep`, `formData`, `tagInputs` |
| JS constants | `UPPER_SNAKE_CASE` | `GMAIL_USER`, `SECTIONS`, `AI_PREF_ES` |
| JS functions | `camelCase` | `startApp()`, `renderStep()`, `submitContact()` |
| Form field IDs | `snake_case` (matches JSON keys) | `biz_name`, `obj_principal` |

### CSS Style
- Compact single-line rule blocks (no newlines between declarations)
- Flat selectors (no nesting)
- Grouped by component with section comments (`/* NAV */`, `/* HERO */`)
- CSS Grid + Flexbox layout
- Mobile-first with breakpoints at 900px and 600px
- Native dark theme via `:root` (no toggle)
- `.reveal` + `IntersectionObserver` for scroll animations
- `.anim-0` through `.anim-4` staggered animation utilities
- Custom cursor (`#cursor`, `#cursor-ring`)
- Canvas-based particle network background

### JavaScript Style
- Global/script-level code (no IIFE, no modules)
- Inline event handlers in HTML attributes (`onclick`, `oninput`)
- Template literals for HTML generation
- `async/await` in serverless functions
- Arrow functions extensively
- Fetch API for backend calls
- No TypeScript, no linter, no bundler

### Email Templates
- Table-based HTML layout for email client compatibility
- Inline styles with `bgcolor` fallback for Outlook
- Dark mode via `@media (prefers-color-scheme: dark)`
- Inline translations via `t(es, en)` helper
- `escapeHTML()` on all user-provided values
- "JIC" logo with gradient `#00D4FF → #00FFC8` in header and signature
- Client confirmation uses human, conversational tone (no AI-style or corporate jargon)

---

## API Endpoints

### `POST /api/sendBrief`
- **Payload**: `{ name, email, company?, phone?, prompt, lang, formData }`
- **Response**: `{ success: true }` or `{ error: string }`
- **Action**: Validates → generates PDF via PDFKit → sends 2 emails:
  1. Admin notification with PDF attachment (`brief-{biz_name}.pdf`) + visual summary
  2. Client confirmation to `[email, GMAIL_USER]` with premium template

### `POST /api/sendContact`
- **Payload**: `{ name, email, company?, project?, message, lang }`
- **Response**: `{ success: true }` or `{ error: string }`
- **Action**: Validates → sends 2 emails:
  1. Admin notification to `GMAIL_USER`
  2. Client confirmation to `[email, GMAIL_USER]`

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `GMAIL_USER` | Gmail address for SMTP authentication |
| `GMAIL_APP_PASSWORD` | Gmail app password (not regular password) |

**Rules:**
- Never expose to frontend code
- Never hardcode credentials
- Always access through `process.env`

---

## Email Standards

All emails must follow the JIC visual identity:

- Gradient header (`#00D4FF → #00FFC8`)
- "JIC" logo mark in header and signature
- Responsive layout (max-width 600px)
- Dark mode support via `@media (prefers-color-scheme: dark)`
- Human, conversational tone — no AI-style wording, no corporate jargon
- Timestamp using `America/Tijuana` timezone
- `escapeHTML()` on all user-supplied values

---

## PDF Standards

- Generated server-side in `sendBrief.js` via PDFKit
- A4 size, 50px margins
- Filename format: `brief-{business_name}.pdf`
- Sanitize business name with `[^a-zA-Z0-9\u00C0-\u024F]`
- Never generate PDFs on the client

---

## localStorage Keys

| Key | Purpose | Persists |
|---|---|---|
| `briefMaestro` | Full form data object | Yes |
| `briefMaestroLang` | Language preference (`es`/`en`) | Yes |
| `briefMaestroAuto` | Auto-navigate flag (test data) | No — deleted after use |

`currentStep` is NOT persisted — always starts at 0 on reload.

---

## Testing with Test Data

Load Salmos Café test fixture in browser console at `brief-maestro.html`:

```javascript
fetch('/test-data.json')
  .then(r => r.json())
  .then(d => {
    localStorage.setItem('briefMaestroLang', 'es');
    localStorage.setItem('briefMaestro', JSON.stringify(d));
    localStorage.setItem('briefMaestroAuto', '1');
    location.reload();
  });

// After reload — auto-navigate to contact form:
if (localStorage.getItem('briefMaestroAuto')) {
  localStorage.removeItem('briefMaestroAuto');
  let i = setInterval(() => {
    let a = document.getElementById('app'), c = document.getElementById('contact-page');
    if (a && c && getComputedStyle(a).display !== 'none') {
      clearInterval(i);
      a.classList.remove('active');
      c.classList.add('active');
      window.scrollTo(0, 0);
    }
  }, 100);
}
```

---

## Security Rules

- Validate all user input on the server
- Protect public endpoints from abuse
- Use honeypot field (contact form already has `<input name="bot" style="display:none">`)
- Keep dependencies updated
- Run security reviews before production deployments

---

## Deployment Rules

- Target: **Vercel only**
- Do not introduce infrastructure requiring Netlify Functions, Cloudflare Workers, AWS Lambda, or Docker unless explicitly requested
- Use `vercel --prod` for production deployment
- Environment variables must be set in Vercel Dashboard

---

## Testing Checklist

Before deployment, verify:

- [ ] Contact form submits successfully
- [ ] Brief submission sends successfully
- [ ] PDF attachment generated and attached to admin email
- [ ] Admin email delivered to `GMAIL_USER`
- [ ] Client confirmation delivered to both `[email, GMAIL_USER]`
- [ ] Timezone displays correct `America/Tijuana` time
- [ ] No console errors in browser
- [ ] No Vercel Function errors (500/502)
- [ ] Both languages (es/en) render correctly
- [ ] Dark mode renders correctly in email clients

---

## Agent Workflow

When receiving a task:

1. **Analyze** — Understand the request, its context, and dependencies
2. **Identify affected files** — Determine which files will change (frontend, API, styles, translations)
3. **Explain the plan** — Present the implementation approach before coding
4. **Estimate risks** — Identify breaking changes, regressions, or security concerns
5. **Implement** — Only after approval for substantial changes

---

## File Modification Policy

- Prefer minimal, surgical edits over rewrites
- Modify only affected sections
- Preserve existing functionality
- Reuse existing code patterns and helpers
- Do not create unnecessary dependencies
- Maintain consistency with current architecture (vanilla HTML/CSS/JS, nodemailer, pdfkit)
- Keep explanations concise to minimize context and token consumption

---

## Architecture Reference

Este proyecto tiene un archivo `ARCHITECTURE.md` que describe:

- Flujo del sistema
- APIs
- Email system
- PDF generation
- Variables de entorno

En caso de duda técnica, consultar `ARCHITECTURE.md` antes de modificar código.

---

## Historical Decisions

### 2026-06 — Netlify → Vercel

Reason: Native Node.js runtime compatibility with Nodemailer and PDFKit.

---

### 2026-06 — Nodemailer upgraded to 8.0.10

Reason: Security updates and compatibility improvements.

---

### 2026-06 — Email Delivery Strategy

Client confirmation emails must be sent using:

```
to: [clientEmail, GMAIL_USER]
```

Do not use CC.

Reason: More reliable delivery behavior when using Gmail SMTP.

---

### 2026-06 — Timezone Standard

All timestamps must use:

```
America/Tijuana
```

---

### 2026-06 — PDF Generation

Brief PDFs are generated server-side using PDFKit and attached to the admin notification email.

---

### Known Issues

- Gmail App Password may expire — must regenerate if email sending fails.

### Monitoring

- Logs: Vercel Dashboard → Deployment → Functions
- Common errors: 500 (env vars misconfigured), 502 (SMTP failure)
