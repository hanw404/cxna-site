@echo off
set "PATH=D:\claudeStuff\nodejs-link;%PATH%"
cd /d "%~dp0"
npm run dev -- --port 4321 --host
