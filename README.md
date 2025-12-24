# Restaurant Menu Management System

A full-stack web application for managing restaurant categories, menu items, pricing, and availability.

## Project cần file .env trong backend và frontend, hỏi người tạo đồ án để biết

## Project Structure

```
Final_project/
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

docker-compose up -d  # Start PostgreSQL
```

### 2. Backend
```bash
cd backend
npm install && npx prisma db push
npm run start:dev
```

### 3. Frontend
```bash
cd frontend
npm install && npm start
```

## Features

### 📋 Table & QR Management (Completed)
- ✅ View/Edit restaurant tables in a grid layout
- ✅ Automatic QR generation with secure JWT tokens
- ✅ Real-time status tracking (Available, Occupied, etc.)

### 🍽️ Menu Management (Current Assignment)
- **Menu Categories**: Full CRUD with name uniqueness, display ordering, and status (Active/Inactive).
- **Menu Items**:
  - Detailed CRUD (Price, Prep Time, Chef Recommendation).
  - Availability status: `Available`, `Unavailable`, `Sold out`.
  - **Soft delete** support to preserve order history.
- **Photos Management**:
  - Upload multiple photos per item (JPG/PNG/WebP).
  - Set primary photos for guest menu display.
- **Item Modifiers**:
  - Create modifier groups (Single-select/Multi-select).
  - Price adjustments per option (e.g., Size, Extras).
- **Admin UI**:
  - Advanced filtering (by name, category, status).
  - Sorting (by price, creation time, popularity).
  - Pagination support for large menus.
- **Guest Menu**:
  - Read-only consumption endpoint for QR flow.
  - Search and category filtering.

## API Endpoints summary

### Admin Menu API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/menu/categories` | List categories (filter/sort) |
| POST | `/api/admin/menu/categories` | Create category |
| GET | `/api/admin/menu/items` | List items (paging/filter/sort) |
| POST | `/api/admin/menu/items` | Create item |
| POST | `/api/admin/menu/items/:id/photos` | Multi-photo upload |
| POST | `/api/admin/menu/modifier-groups` | Create modifier group |

### Table & QR API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tables` | Get all tables |
| PATCH | `/api/tables/:id/status` | Update table status |
| POST | `/api/qr/verify` | Verify QR token |

### Guest API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Load restaurant-scoped menu |

## Database Schema Highlights

- **Menu Item**: id, categoryId, name, price, prepTime, status (available/unavailable/sold_out), isChefRecommended, isDeleted.
- **Menu Category**: id, name (unique), displayOrder, status (active/inactive).
- **Item Photo**: id, menuItemId, url, isPrimary.
- **Modifier Group**: id, name, selectionType (single/multiple), isRequired, minSelections, maxSelections.
- **Modifier Option**: id, groupId, name, priceAdjustment.
- **Table**: id, tableNumber, capacity, location, status, qrToken.

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
- **Assignments**: Table Management & Menu Management
- **Year**: 2024-2025

## License

MIT
