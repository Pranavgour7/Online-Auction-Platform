@echo off
title AuctionHub - Real-Time Auction Platform
color 0A
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
if %errorlevel% neq 0 pause
