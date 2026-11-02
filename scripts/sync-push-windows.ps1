param([switch]$Archive)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$windowsRoot=Join-Path $projectRoot 'win_app'
$portableApp=Join-Path $windowsRoot 'release/ToDoList-win32-x64/resources/app'
foreach($relative in @('assets/js/app-v2.js','assets/js/settings.js','assets/js/login.js','assets/js/i18n.js','assets/js/notifications.js','assets/js/push-model.js','assets/css/style2.css','assets/json/version.json','assets/json/push.json','package.json')) {
    $source=if($relative -eq 'package.json'){Join-Path $windowsRoot $relative}else{Join-Path $projectRoot $relative}
    if($relative -ne 'package.json'){Copy-Item -LiteralPath $source -Destination (Join-Path $windowsRoot $relative) -Force}
    Copy-Item -LiteralPath (Join-Path $windowsRoot $relative) -Destination (Join-Path $portableApp $relative) -Force
}
foreach($name in @('app.html','app-v2.html','settings.html')) { Copy-Item -LiteralPath (Join-Path $windowsRoot "src/$name") -Destination (Join-Path $portableApp "src/$name") -Force }
Copy-Item -LiteralPath (Join-Path $windowsRoot 'README.md') -Destination (Join-Path $portableApp 'README.md') -Force
foreach($destination in @((Join-Path $windowsRoot 'docs'),(Join-Path $portableApp 'docs'))){
    New-Item -ItemType Directory -Path $destination -Force|Out-Null
    Copy-Item -LiteralPath (Join-Path $projectRoot 'docs/NOTIFICATIONS.md') -Destination (Join-Path $destination 'NOTIFICATIONS.md') -Force
}
if($Archive){
    $version=(Get-Content -LiteralPath (Join-Path $projectRoot 'assets/json/version.json') -Raw|ConvertFrom-Json).version
    $archiveRoot=Join-Path $windowsRoot "versions/$version"
    $releaseRoot=Join-Path $windowsRoot "release/$version"
    if((Test-Path -LiteralPath $archiveRoot) -or (Test-Path -LiteralPath $releaseRoot)){throw 'Cette version possède déjà une archive ; aucune archive existante ne sera écrasée.'}
    New-Item -ItemType Directory -Path $archiveRoot,$releaseRoot|Out-Null
    foreach($name in @('src','assets','docs','main.js','package.json','package-lock.json','build','ToDoList.exe','README.md')){Copy-Item -LiteralPath (Join-Path $windowsRoot $name) -Destination $archiveRoot -Recurse}
    Copy-Item -LiteralPath (Join-Path $windowsRoot 'release/ToDoList-win32-x64') -Destination $releaseRoot -Recurse
    $utf8=New-Object System.Text.UTF8Encoding($false)
    [IO.File]::WriteAllText((Join-Path $archiveRoot 'ARCHIVE.txt'),"$version`n$(Get-Date -Format o)`nNotifications push : service Cloudflare gratuit à configurer avant utilisation.`n",$utf8)
}
Write-Output 'Sources et portable Windows synchronisés.'
