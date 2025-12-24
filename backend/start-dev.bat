@echo off
echo ========================================
echo Smart Restaurant - Quick Start
echo ========================================
echo.

echo Ensuring database client is ready...
call npx prisma generate

echo.
echo Opening Prisma Studio (for online database)...
start http://localhost:5555
call npx prisma studio

pause

