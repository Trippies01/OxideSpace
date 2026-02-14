@echo off
title Oxide App - Build
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
cd /d "%~dp0"
npm run tauri:build
echo.
echo Build bitti. .exe konumu: src-tauri\target\release\oxide-app.exe
pause
