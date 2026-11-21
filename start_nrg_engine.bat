@echo off
title NRG Engine - Compiler Backend
cd /d "%~dp0"
echo ====================================================
echo  ⚡ NRG ENGINE — COMPILER BACKEND SERVICE
echo  📡 Port: 3000
echo  🛡 Backend: Judge0 CE Cloud Sandbox
echo ====================================================
echo Starting Node.js server...
node server.js
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server failed to start. Ensure Node.js is installed.
    pause
)
