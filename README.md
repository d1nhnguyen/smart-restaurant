# Smart Restaurant Table Management System

A full-stack web application for managing restaurant tables with real-time status updates and CRUD operations.

## Project cần file .env trong backend và frontend, hỏi người tạo đồ án để biết

## Project Structure

```
<<<<<<< HEAD
Source/
=======
Final_project/
>>>>>>> 8d1ecb68b95bfbcfc2736567e058a5b73a1f293f
├── backend/          # NestJS REST API
├── frontend/         # React web application
```

## Technology Stack

### Backend
- **Framework**: NestJS 10.x
- **Database**: PostgreSQL 15 (Docker)
- **ORM**: Prisma 5.x
- **Runtime**: Node.js with TypeScript

### Frontend
- **Framework**: React 19.x
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Custom CSS

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd Final_project
```

### 2. Start PostgreSQL Database

```bash
docker-compose up -d
```

### 3. Setup Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

Backend will run on: http://localhost:3000/api

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run start
```

Frontend will run on: http://localhost:4000

## Features

- ✅ View all restaurant tables in a grid layout
- ✅ Add new tables with validation
- ✅ Edit existing table information
- ✅ Toggle table status (Active/Inactive)
- ✅ Delete tables
- ✅ Filter by status (All/Active/Inactive)
- ✅ Filter by location
- ✅ Responsive admin sidebar
- ✅ Form validation

## API Endpoints

- `GET /api/tables` - Get all tables with optional filters
- `GET /api/tables/:id` - Get single table
- `POST /api/tables` - Create new table
- `PUT /api/tables/:id` - Update table
- `PATCH /api/tables/:id/status` - Toggle table status
- `DELETE /api/tables/:id` - Delete table
- `GET /api/tables/locations/list` - Get available locations

## Database Schema

### Table Model
- `id` - Unique identifier
- `tableNumber` - Table number (unique)
- `capacity` - Seating capacity (1-20)
- `location` - Table location
- `description` - Optional description
- `status` - ACTIVE or INACTIVE
- `qrToken` - Unique QR token
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Development

### Backend Development
```bash
cd backend
npm run start:dev  # Hot reload with ts-node
```

### Frontend Development
```bash
cd frontend
npm start  # React development server
```

### Database Management
```bash
cd backend
npx prisma studio  # Open Prisma Studio GUI
```

## Project Details

- **Course**: Web Application Development (WAD)
- **Project Type**: Final Project
- **Year**: 2024-2025

## License

MIT
