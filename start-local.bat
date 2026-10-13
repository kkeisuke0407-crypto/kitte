@echo off
rem Kitte-kaitori LP local preview (requires Node.js). Double-click to start; the browser opens automatically. Press Ctrl+C to stop.
chcp 65001 >nul
cd /d "%~dp0"
node tools\serve.cjs
pause
