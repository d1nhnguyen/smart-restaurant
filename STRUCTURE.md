# Project Structure Documentation

## Overview
This is a full-stack table management system for restaurants with QR code integration.

## Directory Structure

```
Source/
├── README.md                      # Project overview and setup
├── STRUCTURE.md                   # This file - detailed structure explanation
│
├── backend/                       # NestJS Backend API
│   ├── src/
│   │   ├── main.ts               # Application entry point
│   │   ├── app.module.ts         # Root module
│   │   │
│   │   ├── tables/               # Table Management Module
│   │   │   ├── tables.module.ts
│   │   │   ├── tables.controller.ts    # REST API endpoints
│   │   │   ├── tables.service.ts       # Business logic
│   │   │   ├── tables-export.service.ts
│   │   │   └── dto/
│   │   │       ├── create-table.dto.ts
│   │   │       ├── update-table.dto.ts
│   │   │       └── update-status.dto.ts
│   │   │
│   │   ├── qr/                   # QR Code Module
│   │   │   ├── qr.module.ts
│   │   │   └── qr.service.ts    # QR generation & verification
│   │   │
│   │   ├── menu/                 # Menu Management Module
│   │   │   ├── menu.module.ts
│   │   │   └── menu.controller.ts
│   │   │
│   │   └── prisma/              # Database Module
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   │
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── seed.js              # Database seed data
│   │
│   ├── test/                    # Test files
│   ├── uploads/                 # Uploaded files
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── docker-compose.yml       # PostgreSQL container
│   ├── setup-db.bat            # Database setup script
│   ├── start-dev.bat           # Development start script
│   ├── API_EXAMPLES.md         # API usage examples
│   └── README.md
│
├── frontend/                    # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   │
│   ├── src/
│   │   ├── index.js            # Application entry
│   │   ├── App.js              # Root component
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── styles.css
│   │   ├── custom-styles.css
│   │   │
│   │   ├── pages/              # Page Components
│   │   │   ├── TablesPage.js   # Table management interface
│   │   │   └── MenuPage.js     # Menu display page
│   │   │
│   │   ├── components/         # Reusable Components
│   │   │   ├── TableCard.js    # Table card display
│   │   │   ├── TableModal.js   # Create/Edit table form
│   │   │   ├── QRCodeModal.js  # QR code display & download
│   │   │   ├── TablePrintTicket.js
│   │   │   └── Sidebar.js      # Navigation sidebar
│   │   │
│   │   ├── setupTests.js
│   │   ├── reportWebVitals.js
│   │   └── App.test.js
│   │
│   ├── package.json
│   ├── styles.css
│   └── README.md
```

## Module Responsibilities

### Backend Modules

#### Tables Module
- CRUD operations for tables
- Status management (available, occupied, reserved, cleaning)
- QR code integration
- Export functionality

#### QR Module
- Generate QR codes with JWT tokens
- Verify QR tokens
- Token validation and expiration

#### Menu Module
- Menu item management
- Category handling
- Pricing and availability

#### Prisma Module
- Database connection management
- Shared database service

### Frontend Components

#### Pages
- **TablesPage**: Main table management interface with grid view
- **MenuPage**: Display menu items for customers

#### Components
- **TableCard**: Display individual table with status and actions
- **TableModal**: Form for creating/editing tables
- **QRCodeModal**: Display and download QR codes
- **Sidebar**: Navigation menu

## Key Features

### 1. Table Management
- Create, read, update, delete tables
- Real-time status updates
- Capacity tracking
- Table numbering system

### 2. QR Code System
- Automatic QR generation on table creation
- JWT-based secure tokens
- Download QR as PNG
- Token verification API

### 3. Status Management
- Available (green)
- Occupied (red)
- Reserved (blue)
- Cleaning (yellow)

## Technology Stack

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **QR Generation**: qrcode library
- **Authentication**: JWT

### Frontend
- **Framework**: React
- **Styling**: CSS3
- **HTTP Client**: Fetch API
- **State Management**: React Hooks

## Data Flow

1. **Table Creation**
   ```
   User → Frontend Form → POST /api/tables → Backend
   → Database Insert → QR Generation → Response
   ```

2. **QR Verification**
   ```
   Customer Scans QR → Token Extracted → POST /api/qr/verify
   → Token Validation → Table Info Response
   ```

3. **Status Update**
   ```
   User → Status Dropdown → PATCH /api/tables/:id/status
   → Database Update → UI Refresh
   ```

## Environment Configuration

### Backend (.env)
```
DATABASE_URL="postgresql://user:password@localhost:5432/restaurant"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3000/api
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tables | Get all tables |
| GET | /api/tables/:id | Get table by ID |
| POST | /api/tables | Create new table |
| PUT | /api/tables/:id | Update table |
| PATCH | /api/tables/:id/status | Update status only |
| DELETE | /api/tables/:id | Delete table |
| POST | /api/tables/:id/qr | Generate new QR |
| POST | /api/qr/verify | Verify QR token |

## Future Enhancements
- [ ] User authentication system
- [ ] Order management integration
- [ ] Real-time updates with WebSockets
- [ ] Mobile app for waiters
- [ ] Analytics dashboard
- [ ] Multi-restaurant support
- [ ] Payment integration
