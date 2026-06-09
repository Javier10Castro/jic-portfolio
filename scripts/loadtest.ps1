<#
.SYNOPSIS
  Load test /api/sendContact and /api/sendBrief endpoints.
  PowerShell 5.1 compatible — no external modules required.

.DESCRIPTION
  Sends N concurrent requests to the specified endpoint and reports:
  - Total / successful / rate-limited counts
  - Response time statistics
  - Rate limit header values (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After)

.PARAMETER Url
  Target URL (default: https://web-portfolio-kappa-wheat.vercel.app)

.PARAMETER Endpoint
  API endpoint to test (default: api/sendContact)

.PARAMETER Concurrency
  Number of concurrent requests (default: 20)

.PARAMETER Duration
  Test duration in seconds (default: 10)

.PARAMETER Payload
  Path to JSON payload file. If omitted, a default payload is used.

.EXAMPLE
  # Basic load test (20 connections, 10s)
  .\scripts\loadtest.ps1

.EXAMPLE
  # Test brief endpoint with 50 concurrent requests for 30s
  .\scripts\loadtest.ps1 -Endpoint api/sendBrief -Concurrency 50 -Duration 30

.EXAMPLE
  # Test with custom payload targeting local dev
  .\scripts\loadtest.ps1 -Url http://localhost:3000 -Endpoint api/sendContact -Concurrency 10 -Duration 5
#>

param(
  [string]$Url = "https://web-portfolio-kappa-wheat.vercel.app",
  [string]$Endpoint = "api/sendContact",
  [int]$Concurrency = 20,
  [int]$Duration = 10,
  [string]$Payload = ""
)

$ErrorActionPreference = "Stop"
$target = "$Url/$Endpoint".TrimEnd('/')
$timeoutMs = 30000
$endTime = [DateTime]::Now.AddSeconds($Duration)

# Default payload — includes submittedAt for timing check
$body = @{
  name         = "Load Test"
  email        = "loadtest@example.com"
  message      = "Performance test message — please ignore"
  company      = "LoadTest Inc"
  submittedAt  = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
  lang         = "en"
} | ConvertTo-Json

if ($Payload -and (Test-Path -LiteralPath $Payload)) {
  $body = Get-Content -LiteralPath $Payload -Raw
  Write-Host "Using payload from: $Payload" -ForegroundColor Cyan
}

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "LOAD TEST — $target" -ForegroundColor Cyan
Write-Host "Concurrency: $Concurrency | Duration: ${Duration}s" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$global:results = [System.Collections.Concurrent.ConcurrentBag[int]]::new()
$global:latencies = [System.Collections.Concurrent.ConcurrentBag[long]]::new()
$global:headersBag = [System.Collections.Concurrent.ConcurrentBag[string]]::new()
$global:active = $true
$global:requestCount = 0

function Send-Request {
  $script:requestCount++
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $req = [System.Net.WebRequest]::Create($target)
    $req.Method = "POST"
    $req.ContentType = "application/json"
    $req.Timeout = $timeoutMs
    $req.Headers.Add("User-Agent", "LoadTest/1.0")

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()

    $resp = $req.GetResponse()
    $statusCode = [int]$resp.StatusCode
    $sw.Stop()

    # Read headers
    $limit = $resp.Headers["X-RateLimit-Limit"]
    $remaining = $resp.Headers["X-RateLimit-Remaining"]
    $retryAfter = $resp.Headers["Retry-After"]

    $global:results.Add($statusCode)
    $global:latencies.Add($sw.ElapsedMilliseconds)

    if ($remaining -or $retryAfter) {
      $global:headersBag.Add("$statusCode|$limit|$remaining|$retryAfter")
    }

    $resp.Close()
  } catch {
    $sw.Stop()
    $global:latencies.Add($sw.ElapsedMilliseconds)
    if ($_.Exception.InnerException -is [System.Net.WebException]) {
      $wex = $_.Exception.InnerException
      if ($wex.Response) {
        $statusCode = [int]$wex.Response.StatusCode
        $global:results.Add($statusCode)

        $limit = $wex.Response.Headers["X-RateLimit-Limit"]
        $remaining = $wex.Response.Headers["X-RateLimit-Remaining"]
        $retryAfter = $wex.Response.Headers["Retry-After"]
        if ($remaining -or $retryAfter) {
          $global:headersBag.Add("$statusCode|$limit|$remaining|$retryAfter")
        }
      } else {
        $global:results.Add(0)
      }
    } else {
      $global:results.Add(0)
    }
  }
}

# Launch runners
$runners = @()
$completed = $false

for ($i = 0; $i -lt $Concurrency; $i++) {
  $runner = [powershell]::Create().AddScript({
    param($parent)
    while ($parent.Variables["active"].Value) {
      & $parent.Variables["Send-Request"].Value
    }
  }).AddArgument($MyInvocation.MyCommand.ScriptBlock.Module)

  $runner.Variables["active"] = New-Object PSVariable("active", $true)
  $runner.Variables["Send-Request"] = New-Object PSVariable("Send-Request", $function:Send-Request)
  $runners += $runner
  $null = $runner.BeginInvoke()
}

# Wait for duration
Start-Sleep -Seconds $Duration
$global:active = $false

# Wait for runners to finish
Start-Sleep -Seconds 2
foreach ($r in $runners) { $r.Dispose() }

# Report
$total = $global:results.Count
$success = @($global:results | Where-Object { $_ -eq 200 }).Count
$badRequest = @($global:results | Where-Object { $_ -eq 400 }).Count
$rateLimited = @($global:results | Where-Object { $_ -eq 429 }).Count
$serverError = @($global:results | Where-Object { $_ -ge 500 }).Count
$timeouts = @($global:results | Where-Object { $_ -eq 0 }).Count
$other = $total - $success - $badRequest - $rateLimited - $serverError - $timeouts

$latArray = $global:latencies.ToArray()
$avgLat = if ($latArray.Count -gt 0) { ($latArray | Measure-Object -Average).Average } else { 0 }
$maxLat = if ($latArray.Count -gt 0) { ($latArray | Measure-Object -Maximum).Maximum } else { 0 }
$minLat = if ($latArray.Count -gt 0) { ($latArray | Measure-Object -Minimum).Minimum } else { 0 }

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "RESULTS" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Total requests : $total"
Write-Host "  200 Success  : $success"
Write-Host "  400 Bad Req  : $badRequest"
Write-Host "  429 Limited  : $rateLimited"
Write-Host "  5xx Error    : $serverError"
Write-Host "  Timeout      : $timeouts"
Write-Host "  Other        : $other"
Write-Host ""
Write-Host "Latency (ms)  :" (if ($latArray.Count -gt 0) { "avg=$([math]::Round($avgLat,1)) min=$minLat max=$maxLat" } else { "N/A" })
Write-Host ""
Write-Host "Rate limit headers (sample):"
$global:headersBag.ToArray() | Group-Object | Sort-Object Count -Descending | Select-Object -First 5 | ForEach-Object {
  $parts = $_.Name.Split('|')
  Write-Host "  Status=$($parts[0]) Limit=$($parts[1]) Remaining=$($parts[2]) Retry-After=$($parts[3])s — $($_.Count) requests"
}
Write-Host ""
Write-Host "Done." -ForegroundColor Green
