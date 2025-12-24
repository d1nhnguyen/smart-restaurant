# Backend - Smart Restaurant Table Management API

NestJS REST API for managing restaurant tables with PostgreSQL and Prisma ORM.

## 🚀 Team Quick Start

Follow these steps to get the project running on your local machine:

### 1. Clone & Install dependencies
```bash
git clone <repository-url>
cd table-management/backend
npm install
```

### 2. Configure Environment Variables
- Copy `.env.example` and rename it to `.env`.
- Get the **DATABASE_URL** from the team leader and paste it into `.env`.
> [!IMPORTANT]
> Never commit your `.env` file to GitHub.

### 3. Initialize Database (Online)
Run the setup script to generate the database client and push the schema to the online database:
```bash
# Windows
./setup-db.bat
```
This script will:
- Generate Prisma Client
- Sync database schema with the online Neon database
- Seed initial sample data

### 4. Run the Application
```bash
npm run start:dev
```
The API will be available at: http://localhost:3000/api

---

## 🛠 Tech Stack

- **Framework**: NestJS 10.3.0
- **Database**: PostgreSQL (Neon.tech)
- **ORM**: Prisma 5.7.0
- **Language**: TypeScript

## 📂 Project Structure
```
backend/
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.js         # Sample data seeding
├── src/
│   ├── main.ts         # Entry point
│   └── tables/         # Table management module
├── setup-db.bat        # Quick database setup script
└── start-dev.bat       # Quick start script (opens Prisma Studio)
```

## 📜 Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npx prisma studio` - Open database GUI (Browser)
- `npx prisma db push` - Push local schema changes to online database

## 💡 Collaboration Workflow

- **Changing Schema**: If you modify `prisma/schema.prisma`, run `npx prisma db push` to update the online database and commit your changes.
- **Syncing Schema**: If someone else changed the schema, run `npx prisma generate` after pulling the code.

## 📞 Common Issues
- **Connection Error**: Check your `DATABASE_URL` in `.env` and ensure your internet connection is stable.
- **Prisma Error**: Try running `npx prisma generate` to rebuild the client.

---
License: MIT
