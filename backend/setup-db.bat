@echo off
echo ========================================
echo Smart Restaurant - Database Setup
echo ========================================
echo.

echo [1/3] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Failed to generate Prisma Client
    pause
    exit /b 1
)
echo ✅ Prisma Client generated

echo.
echo [2/3] Creating/Updating database tables online...
call npx prisma db push
if errorlevel 1 (
    echo ❌ Failed to push schema to online database
    pause
    exit /b 1
)
echo ✅ Database tables updated

echo.
echo [3/3] Seeding the database (Optional)...
echo Running seed command...
call npm run db:seed
if errorlevel 1 (
    echo ⚠️ Seed failed (this might be okay if data already exists)
) else (
    echo ✅ Database seeded
)

echo.
echo ========================================
echo 🎉 Online Database setup completed!
echo ========================================
echo.
echo Next steps:
echo 1. Run the app: npm run start:dev
echo 2. Open Prisma Studio: npm run db:studio
echo.
pause

