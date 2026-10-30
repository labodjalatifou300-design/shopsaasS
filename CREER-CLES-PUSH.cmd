@echo off
cd /d "%~dp0"
echo.
echo Creating your private notification keys...
echo.
node scripts\generate-push-values.cjs
if errorlevel 1 (
  echo.
  echo Check the message above.
  echo Do not delete PUSH-VALUES.txt if it already exists.
  echo.
  pause
  exit /b 1
)
echo.
echo Done. Open PUSH-VALUES.txt in this same project folder.
echo Do not send that file to anyone.
echo.
pause
