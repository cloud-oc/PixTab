@echo off
setlocal enabledelayedexpansion

REM PixTab Build Script (Windows)
REM Generates Chrome/Edge and Firefox extension packages

echo [BUILD] Starting PixTab packaging...

REM Switch to project root directory
cd /d "%~dp0.."

REM Read version from manifest.json
for /f "tokens=2 delims=:," %%a in ('findstr /c:"\"version\"" manifest.json') do (
    set VERSION=%%~a
    set VERSION=!VERSION:"=!
    set VERSION=!VERSION: =!
)
echo [INFO] Version: %VERSION%

REM Clean and recreate dist directory
if exist dist rmdir /s /q dist
mkdir dist

REM Chrome/Edge packaging
echo [PACK] Building Chrome/Edge version...
REM Use tar to create zip with forward slashes to avoid Firefox AMO "Invalid file name" error
tar -a -cf "dist\pixtab-%VERSION%-chrome.zip" manifest.json LICENSE index.html options.html style.css _locales icons src

REM Firefox packaging (temporarily modify manifest)
echo [PACK] Building Firefox version...
copy manifest.json manifest.backup.json >nul

REM Use PowerShell to parse and update JSON (more robust)
REM Firefox does not support service_worker, convert to scripts array format
powershell -Command "$m = Get-Content manifest.json -Raw | ConvertFrom-Json; if ($m.background -and $m.background.service_worker) { $sw = $m.background.service_worker; $type = $m.background.type; $m.background = New-Object PSObject; $m.background | Add-Member scripts @($sw); if ($type) { $m.background | Add-Member type $type } }; if ($m.action -and $m.action.default_icon -is [System.Collections.Hashtable]) { $icon = $m.action.default_icon.'48' -or $m.action.default_icon.'32' -or $m.action.default_icon.'16' -or $m.action.default_icon.'128'; if (-not $icon) { $icon = 'icons/icon-48.png' }; $m.action.default_icon = $icon }; if (-not $m.browser_specific_settings) { $m.browser_specific_settings = New-Object PSObject }; if (-not $m.browser_specific_settings.gecko) { $m.browser_specific_settings | Add-Member gecko (New-Object PSObject) }; $m.browser_specific_settings.gecko.strict_min_version = '113.0'; $m.browser_specific_settings | Add-Member gecko_android (New-Object PSObject -Property @{ strict_min_version = '113.0' }) -Force; $m | ConvertTo-Json -Depth 10 | Set-Content manifest.json"
powershell -Command "$m = Get-Content manifest.json -Raw | ConvertFrom-Json; if ($m.background -and $m.background.service_worker) { $sw = $m.background.service_worker; $type = $m.background.type; $m.background = New-Object PSObject; $m.background | Add-Member -NotePropertyName scripts -NotePropertyValue @($sw); if ($type) { $m.background | Add-Member -NotePropertyName type -NotePropertyValue $type } }; if ($m.action -and $m.action.default_icon -is [System.Collections.Hashtable]) { $icon = $null; foreach ($k in @('48','32','16','128')) { if ($m.action.default_icon.ContainsKey($k) -and $m.action.default_icon.$k) { $icon = $m.action.default_icon.$k; break } }; if (-not $icon) { $icon = 'icons/icon-48.png' }; $m.action.default_icon = $icon }; if (-not $m.browser_specific_settings) { $m.browser_specific_settings = New-Object PSObject }; if (-not $m.browser_specific_settings.gecko) { $m.browser_specific_settings | Add-Member -NotePropertyName gecko -NotePropertyValue (New-Object PSObject) }; $m.browser_specific_settings.gecko.strict_min_version = '113.0'; if (-not $m.browser_specific_settings.gecko_android) { $m.browser_specific_settings | Add-Member -NotePropertyName gecko_android -NotePropertyValue (New-Object PSObject -Property @{ strict_min_version = '113.0' }) } else { $m.browser_specific_settings.gecko_android.strict_min_version = '113.0' }; if (-not $m.browser_specific_settings.gecko.data_collection_permissions) { $m.browser_specific_settings.gecko | Add-Member -NotePropertyName data_collection_permissions -NotePropertyValue (New-Object PSObject -Property @{ collects = $false; required = @('none'); optional = @() }) }; $m | ConvertTo-Json -Depth 10 | Set-Content manifest.json"

tar -a -cf "dist\pixtab-%VERSION%-firefox.zip" manifest.json LICENSE index.html options.html style.css _locales icons src

REM Rename to .xpi
if exist "dist\pixtab-%VERSION%-firefox.xpi" del "dist\pixtab-%VERSION%-firefox.xpi"
ren "dist\pixtab-%VERSION%-firefox.zip" "pixtab-%VERSION%-firefox.xpi"

REM Restore original manifest
move /y manifest.backup.json manifest.json >nul

echo.
echo [DONE] Packaging complete!
echo    - dist\pixtab-%VERSION%-chrome.zip  -^> Chrome Web Store / Edge Add-ons
echo    - dist\pixtab-%VERSION%-firefox.xpi -^> Firefox AMO

pause
