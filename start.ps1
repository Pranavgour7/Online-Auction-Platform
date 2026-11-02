# AuctionHub - Real-Time Auction Platform Startup Script
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    AuctionHub - Real-Time Auction Platform" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

if (Test-Path "server\.env") {
    $envContent = Get-Content "server\.env" -Raw
    if ($envContent -match "mongodb\+srv://") {
        Write-Host "[OK] Using MongoDB Atlas Cloud Database." -ForegroundColor Green
    } else {
        $portOpen = Test-NetConnection -ComputerName "127.0.0.1" -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue
        if (-not $portOpen) {
            Write-Host "[*] MongoDB not detected on port 27017. Launching local daemon..." -ForegroundColor Yellow
            if (Test-Path "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe") {
                if (-not (Test-Path "server\mongodb_data")) { New-Item -ItemType Directory -Path "server\mongodb_data" | Out-Null }
                Start-Process "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" -ArgumentList "--dbpath server\mongodb_data --port 27017" -WindowStyle Minimized
                Start-Sleep -Seconds 2
                Write-Host "[OK] Local MongoDB daemon launched." -ForegroundColor Green
            }
        } else {
            Write-Host "[OK] Local MongoDB is active on port 27017." -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "[*] Starting Server (Port 5000) and Client (Port 3000)..." -ForegroundColor Yellow
Write-Host "[*] Backend API:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "[*] Frontend App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "[*] Press Ctrl+C at any time to stop." -ForegroundColor Gray
Write-Host ""

npm run dev

