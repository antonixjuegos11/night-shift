@echo off
cd /d "%~dp0"
if not exist node_modules\phaser (
  echo Instalando dependencias...
  call npm install
)
start "" http://localhost:8080
node server.js 8080
