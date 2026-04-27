# Stops a prior "next dev" (or its workers) for this app so a new dev server can
# start without ".next\dev\lock" conflicts. Safe to run every time: no-op if
# nothing is using this project directory.
$app = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$lock = Join-Path (Join-Path (Join-Path $app ".next") "dev") "lock"

function Stop-NodeIfOurDev {
  param([string] $cl, [int] $processId)
  if (-not $cl) { return $false }
  if ($cl -notlike "*$app*") { return $false }
  # e.g. ...\next" dev (CLI), start-server, postcss, or npm run dev --prefix this app
  if ($cl -match 'next[\\/]dist[\\/]bin[\\/]next"\s+dev' -or
    $cl -like "*start-server*" -or
    $cl -like "*\.next\dev\build\postcss*" -or
    $cl -like "*\.next/dev/build/postcss*" -or
    ($cl -like "*npm*cli*" -and $cl -like "*dev*" -and $cl -like "*localgrowth*")
  ) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    return $true
  }
  return $false
}

Get-CimInstance Win32_Process -Filter "name = 'node.exe'" | ForEach-Object {
  $null = Stop-NodeIfOurDev -cl $_.CommandLine -processId $_.ProcessId
}
Start-Sleep -Milliseconds 600
if (Test-Path $lock) {
  try {
    Remove-Item $lock -Force -ErrorAction Stop
  }
  catch {
    # If another next dev is still live, the lock is held — user must close that window.
  }
}
