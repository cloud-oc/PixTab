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

REM 清空并重建 dist 目录
if exist dist rmdir /s /q dist
mkdir dist

REM Chrome/Edge 打包
echo 📦 打包 Chrome/Edge 版本...
powershell -Command "Compress-Archive -Force -Path 'manifest.json','LICENSE','index.html','options.html','style.css','_locales','icons','src' -DestinationPath 'dist\pixtab-%VERSION%-chrome.zip'"

REM Firefox 打包（临时修改 manifest）
echo 📦 打包 Firefox 版本...
copy manifest.json manifest.backup.json >nul

REM 使用 PowerShell 解析并更新 JSON（更稳健）
powershell -Command "$m = Get-Content manifest.json | ConvertFrom-Json; if ($m.background.service_worker) { $m.background.scripts = @($m.background.service_worker); $m.background.PSObject.Properties.Remove('service_worker'); $m.background.PSObject.Properties.Remove('type') } ; if ($m.action -and $m.action.default_icon -is [System.Collections.Hashtable]) { $icon = $m.action.default_icon.'48' -or $m.action.default_icon.'32' -or $m.action.default_icon.'16' -or $m.action.default_icon.'128'; if (-not $icon) { $icon = 'icons/icon-48.png' }; $m.action.default_icon = $icon }; if (-not $m.browser_specific_settings) { $m.browser_specific_settings = @{ } }; if (-not $m.browser_specific_settings.gecko) { $m.browser_specific_settings.gecko = @{ } }; $m.browser_specific_settings.gecko.strict_min_version = '142.0'; $m.browser_specific_settings.gecko_android = @{ strict_min_version = '142.0' }; if (-not $m.browser_specific_settings.gecko.data_collection_permissions) { $m.browser_specific_settings.gecko.data_collection_permissions = @{ collects = $false ; required = @('none') ; optional = @() } } ; $m | ConvertTo-Json -Depth 10 | Set-Content manifest.json"

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
