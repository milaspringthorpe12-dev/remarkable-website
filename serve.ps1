# Local static file server for previewing the RE:Markable website, no Python/Node required.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1

$root = $PSScriptRoot
$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".ico"  = "image/x-icon"
  ".json" = "application/json"
}

$listener = $null
$port = 5500
for ($p = 5500; $p -le 5510; $p++) {
  $candidate = New-Object System.Net.HttpListener
  $candidate.Prefixes.Add("http://localhost:$p/")
  try {
    $candidate.Start()
    $listener = $candidate
    $port = $p
    break
  } catch {
    continue
  }
}

if (-not $listener) {
  Write-Host "Could not bind to any port in range 5500-5510."
  exit 1
}

Write-Host "Serving $root at http://localhost:$port/"

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response
  try {
    $path = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
    if ($path -eq "/") { $path = "/index.html" }
    $path = $path.TrimStart('/')
    $filePath = Join-Path $root $path
    $fullRoot = (Resolve-Path $root).Path
    $resolved = $null
    if (Test-Path $filePath -PathType Leaf) {
      $resolved = (Resolve-Path $filePath).Path
    }
    if ($resolved -and $resolved.StartsWith($fullRoot)) {
      $ext = [System.IO.Path]::GetExtension($filePath)
      $contentType = $mime[$ext]
      if (-not $contentType) { $contentType = "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $response.ContentType = $contentType
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $response.StatusCode = 404
      $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
      $response.OutputStream.Write($notFound, 0, $notFound.Length)
    }
  } catch {
    $response.StatusCode = 500
  } finally {
    $response.OutputStream.Close()
  }
}
