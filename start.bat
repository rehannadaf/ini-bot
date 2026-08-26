@echo off
title INI Bot

echo Starting INI Bot Backend...
start "INI Bot Backend" cmd /k "cd /d C:\Users\Dell\ini-bot\backend && node server.js"

timeout /t 2 /nobreak >nul

echo Starting INI Bot Frontend...
start "INI Bot Frontend" cmd /k "cd /d C:\Users\Dell\ini-bot\frontend && npm run dev"

timeout /t 4 /nobreak >nul

echo.
echo INI Bot is starting...
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.

start http://localhost:5173