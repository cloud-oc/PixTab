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

REM Chrome packaging
echo [PACK] Building Chrome version...
tar -a -cf "dist\pixtab-%VERSION%-chrome.zip" manifest.json LICENSE index.html options.html style.css _locales icons src

REM Firefox packaging (temporarily modify manifest)
echo [PACK] Building Firefox version...
copy manifest.json manifest.backup.json >nul

REM Use external Node.js script for manifest conversion (more reliable)
node "%~dp0convert-manifest-firefox.js"

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
