$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$windowsRoot = Join-Path $projectRoot 'win_app'
$version = 'v5.4.3'
$portable = Join-Path $windowsRoot 'release/ToDoList-win32-x64'
$archive = Join-Path $windowsRoot "versions/$version"
$versionRelease = Join-Path $windowsRoot "release/$version"
foreach ($target in @($portable, $archive, $versionRelease)) {
    $resolvedTarget = [IO.Path]::GetFullPath($target)
    if (-not $resolvedTarget.StartsWith($windowsRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Target outside workspace: $resolvedTarget" }
}
if ((Test-Path -LiteralPath $archive) -or (Test-Path -LiteralPath $versionRelease)) { throw 'Version already archived; previous archives must never be overwritten.' }

# Mirror shared sources; Windows keeps app.html as its actual entry page.
Copy-Item -LiteralPath (Join-Path $projectRoot 'assets/js'), (Join-Path $projectRoot 'assets/css'), (Join-Path $projectRoot 'assets/json') -Destination (Join-Path $windowsRoot 'assets') -Recurse -Force
Get-ChildItem -LiteralPath (Join-Path $projectRoot 'pages') -Filter '*.html' | ForEach-Object {
    if ($_.Name -eq 'app-v2.html') {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $windowsRoot 'src/app.html') -Force
    } elseif ($_.Name -ne 'app.html') {
        Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $windowsRoot "src/$($_.Name)") -Force
    }
}
$redirect = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><script>location.replace("./app.html" + location.search);</script><title>To-Do List</title></head><body></body></html>'
Set-Content -LiteralPath (Join-Path $windowsRoot 'src/app-v2.html') -Value $redirect -Encoding utf8
$appResources = Join-Path $portable 'resources/app'
foreach ($item in @('src','assets','main.js','package.json','package-lock.json','README.md')) {
    Copy-Item -LiteralPath (Join-Path $windowsRoot $item) -Destination $appResources -Recurse -Force
}

New-Item -ItemType Directory -Path $archive -Force | Out-Null
foreach ($item in @('src','assets','build','main.js','package.json','package-lock.json','ToDoList.exe','README.md')) {
    Copy-Item -LiteralPath (Join-Path $windowsRoot $item) -Destination $archive -Recurse
}
Set-Content -LiteralPath (Join-Path $archive 'ARCHIVE.txt') -Encoding utf8 -Value 'v5.4.3 — 2026-11-03. Sources archivées. Portable correspondant : ../../release/v5.4.3/ToDoList-win32-x64/ToDoList.exe. Aucun installeur NSIS généré.'

# Repackage the existing Electron runtime with only current application sources.
# Historical packager output contains old archives; do not recursively embed them.
$packaged = Join-Path $versionRelease 'ToDoList-win32-x64'
New-Item -ItemType Directory -Path $packaged -Force | Out-Null
Get-ChildItem -LiteralPath $portable | Where-Object Name -ne 'resources' | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $packaged -Recurse
}
$cleanResources = Join-Path $packaged 'resources/app'
New-Item -ItemType Directory -Path $cleanResources -Force | Out-Null
foreach ($item in @('src','assets','main.js','package.json','package-lock.json','README.md')) {
    Copy-Item -LiteralPath (Join-Path $windowsRoot $item) -Destination $cleanResources -Recurse
}
$rcedit = Join-Path $windowsRoot 'node_modules/electron-winstaller/vendor/rcedit.exe'
foreach ($binary in @((Join-Path $packaged 'ToDoList.exe'), (Join-Path $portable 'ToDoList.exe'))) {
    & $rcedit $binary --set-file-version '5.4.3' --set-product-version '5.4.3'
    if ($LASTEXITCODE -ne 0) { throw "Unable to update executable metadata: $binary" }
}
Write-Output "Sources synchronized; archives created: $archive and $packaged"
