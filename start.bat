@echo off
echo 🚀 Starting ShaRay Whisk&Willow Website...

REM Start backend in new window
cd backend
start "Backend" cmd /c "npm run dev"
set BACKEND_PID=%ERRORLEVEL%

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
cd ..\frontend
start "Frontend" cmd /c "npx http-server -p 8080"
set FRONTEND_PID=%ERRORLEVEL%

echo.
echo ✅ Backend running on http://localhost:3000
echo ✅ Frontend running on http://localhost:8080
echo.
echo Press any key to stop both servers...
pause >nul

REM Kill both processes (by window title)
taskkill /FI "WINDOWTITLE eq Backend*" /T /F
taskkill /FI "WINDOWTITLE eq Frontend*" /T /F
