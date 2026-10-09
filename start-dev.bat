@echo off
cd /d "%~dp0"
echo Starting Laravel, Vite and supporting services. Press Ctrl+C to stop.
composer run dev -- --inline
