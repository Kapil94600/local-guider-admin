# scripts/clean-console.ps1
# ═══════════════════════════════════════════════════════════════
# CONSOLE.LOG → LOGGER AUTOMATED REPLACEMENT
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 CONSOLE.LOG → LOGGER CLEANUP" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── Backup first ───
$backupPath = "src.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "📦 Creating backup: $backupPath" -ForegroundColor Yellow
Copy-Item -Path src -Destination $backupPath -Recurse
Write-Host "✅ Backup created" -ForegroundColor Green
Write-Host ""

# ─── Process files ───
$files = Get-ChildItem -Path src -Recurse -Include *.js,*.jsx | Where-Object {
  $_.FullName -notmatch "\\utils\\logger\.js$"  # Skip logger.js itself
}

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
  $content = Get-Content -Path $file.FullName -Raw
  $original = $content
  $fileChanged = $false

  # ─── Replace console.log → logger.info ───
  if ($content -match 'console\.log\(') {
    $content = $content -replace 'console\.log\(', 'logger.info('
    $fileChanged = $true
  }

  # ─── Replace console.warn → logger.warn ───
  if ($content -match 'console\.warn\(') {
    $content = $content -replace 'console\.warn\(', 'logger.warn('
    $fileChanged = $true
  }

  # ─── Replace console.error → logger.error ───
  if ($content -match 'console\.error\(') {
    $content = $content -replace 'console\.error\(', 'logger.error('
    $fileChanged = $true
  }

  # ─── Replace console.debug → logger.debug ───
  if ($content -match 'console\.debug\(') {
    $content = $content -replace 'console\.debug\(', 'logger.debug('
    $fileChanged = $true
  }

  # ─── Only write if changed ───
  if ($fileChanged) {
    # ─── Add import if not already there ───
    if ($content -notmatch "import logger from") {
      # Determine relative path based on file location
      $relativePath = $file.FullName -replace [regex]::Escape((Get-Location).Path + "\src\"), ""
      $depth = ($relativePath.Split("\").Count) - 1
      $prefix = "../" * $depth

      # Add import after the first line or at top
      $importLine = "import logger from `"${prefix}utils/logger`";`n"
      $content = $importLine + $content
    }

    Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding utf8
    $totalFiles++
    Write-Host "✅ Updated: $($file.FullName | Split-Path -Leaf)" -ForegroundColor Green
  }
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 Files changed: $totalFiles" -ForegroundColor Green
Write-Host "📦 Backup location: $backupPath" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""