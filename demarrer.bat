@echo off
rem Lance un serveur local et ouvre le kiosque dans le navigateur.
rem Necessaire car les modules JavaScript (import/export) sont bloques
rem par les navigateurs quand la page est ouverte directement en double-clic
rem (protocole file://) -- ca ressemble a une erreur CORS dans la console.

cd /d "%~dp0"

set PORT=8000

rem Identifiants OVH (module ovhVps) : charge .env s'il existe, jamais commite.
if exist .env (
  for /f "usebackq tokens=1,* delims==" %%A in (".env") do set "%%A=%%B"
)

start "Kiosque - serveur local (ne pas fermer)" /min cmd /c "python server.py %PORT%"

timeout /t 1 /nobreak >nul

start "" "http://localhost:%PORT%/"
