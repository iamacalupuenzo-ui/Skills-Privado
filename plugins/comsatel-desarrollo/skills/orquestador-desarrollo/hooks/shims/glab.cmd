@echo off
set "COMSATEL_SHIM_DIR=%~dp0"
node "%~dp0..\guardia-shim.mjs" glab %*
exit /b %errorlevel%
