@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM PixTab 打包脚本 (Windows)
REM 生成 Chrome/Edge 和 Firefox 两个版本的扩展包

echo 🔨 开始打包 PixTab...

REM 切换到项目根目录
cd /d "%~dp0.."

REM 从 manifest.json 读取版本号
for /f "tokens=2 delims=:," %%a in ('findstr /c:"\"version\"" manifest.json') do (
    set VERSION=%%~a
    set VERSION=!VERSION:"=!
    set VERSION=!VERSION: =!
)
echo 📋 版本号: %VERSION%

REM 创建 dist 目录
if not exist dist mkdir dist

REM Chrome/Edge 打包
echo 📦 打包 Chrome/Edge 版本...
powershell -Command "Compress-Archive -Force -Path 'manifest.json','LICENSE','index.html','options.html','style.css','_locales','icons','src' -DestinationPath 'dist\pixtab-%VERSION%-chrome.zip'"

REM Firefox 打包（临时修改 manifest）
echo 📦 打包 Firefox 版本...
copy manifest.json manifest.backup.json >nul

REM 替换 service_worker 为 scripts
powershell -Command "(Get-Content manifest.json) -replace '\"service_worker\": \"src/background/runtime.js\",', '\"scripts\": [\"src/background/runtime.js\"]' | Set-Content manifest.json"
powershell -Command "(Get-Content manifest.json) | Where-Object { $_ -notmatch '\"type\": \"module\"' } | Set-Content manifest.json"

powershell -Command "Compress-Archive -Force -Path 'manifest.json','LICENSE','index.html','options.html','style.css','_locales','icons','src' -DestinationPath 'dist\pixtab-%VERSION%-firefox.zip'"

REM 重命名为 .xpi
if exist "dist\pixtab-%VERSION%-firefox.xpi" del "dist\pixtab-%VERSION%-firefox.xpi"
ren "dist\pixtab-%VERSION%-firefox.zip" "pixtab-%VERSION%-firefox.xpi"

REM 恢复原始 manifest
move /y manifest.backup.json manifest.json >nul

echo.
echo ✅ 打包完成!
echo    - dist\pixtab-%VERSION%-chrome.zip  → Chrome Web Store / Edge Add-ons
echo    - dist\pixtab-%VERSION%-firefox.xpi → Firefox AMO

pause
