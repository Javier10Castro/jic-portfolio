# Inline SMTP Diagnostic Test

## Hypothesis

Vercel is freezing the serverless function after `202 Accepted` is returned but before Nodemailer completes the SMTP conversation. This would explain why `smtp.start.admin` and `smtp.start.client` appear in logs but `smtp.complete.*` / `smtp.timeout.*` / `smtp.error.*` never do.

## Method

This branch (`diagnostic-inline-smtp`) bypasses the background queue entirely. Instead of:

```
INCOMING → enqueue → 202 → (Vercel freezes background work) → SMTP never finishes
```

It does:

```
INCOMING → transporter.verify() → await sendWithTimeout(admin) + sendWithTimeout(client) → 200
```

Both SMTP sends run inside the HTTP handler with `await`. The response is not sent until both complete (or timeout).

## Test Procedure

1. Deploy this branch to Vercel:

```powershell
vercel --prod
```

2. Submit a brief via the web form (brief-maestro.html) or test via `Invoke-RestMethod`:

```powershell
# Test 1: Contact form
$body = @{ name="Test Inline"; email="test.inline.diagnostic@gmail.com"; message="Diagnostic test — inline SMTP"; lang="en"; submittedAt=(Get-Date -Format o) } | ConvertTo-Json
Invoke-RestMethod -Uri "https://<your-domain>.vercel.app/api/sendContact" -Method Post -Body $body -ContentType "application/json" -Headers @{ "Origin" = "https://<your-domain>.vercel.app" }

# Test 2: Brief form
$body = @{ name="Test Inline Brief"; email="test.inline.brief@gmail.com"; prompt="Diagnostic brief — inline SMTP"; lang="en"; submittedAt=(Get-Date -Format o); formData=@{biz_name="Diagnostic Test"} } | ConvertTo-Json -Depth 3
Invoke-RestMethod -Uri "https://<your-domain>.vercel.app/api/sendBrief" -Method Post -Body $body -ContentType "application/json" -Headers @{ "Origin" = "https://<your-domain>.vercel.app" }
```

3. Check Vercel logs:

```powershell
vercel logs --follow | Select-String -Pattern "smtp\.|email\.|inline|Processing-Mode: inline"
```

## Expected Outcomes

| Outcome | Meaning | Action |
|---|---|---|
| `smtp.complete.admin` + `smtp.complete.client` appear in logs AND email is delivered | SMTP works; queue was the problem | Merge to main, redesign queue |
| `smtp.timeout.admin` or `smtp.timeout.client` appears | Nodemailer is slow but Vercel kept function alive | Increase timeout or use external SMTP relay |
| Neither `smtp.complete.*` nor `smtp.timeout.*` nor `smtp.error.*` appears | Vercel is freezing the function mid-SMTP regardless of await | Must move SMTP out of Vercel entirely (external worker / SMTP relay API) |
| Response is 200 but no email is delivered | SMTP failure masked by timeout | Check Gmail spam / SMTP credentials |

## Rollback

If the test confirms the hypothesis (SMTP completes when awaited), merge and redesign the queue to use `await` internally before returning 200.

If the test shows Vercel still kills SMTP mid-flight, the architecture needs to change: use an external email relay API (SendGrid / Mailgun / Resend) instead of direct Nodemailer SMTP.

## Branch

```
diagnostic-inline-smtp
```
