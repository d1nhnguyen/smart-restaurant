# Backend - Smart Restaurant Management System

A modern, feature-rich backend for restaurant management built with NestJS, supporting QR-based ordering, real-time updates, multi-language support, and payment integration.

---

## 🚀 Technology Stack

### Core Framework
- **NestJS 10.3** - Progressive Node.js framework for building efficient and scalable server-side applications
- **TypeScript 5.3** - Strongly typed programming language that builds on JavaScript
- **Node.js** - JavaScript runtime environment

### Database & ORM
- **PostgreSQL** - Advanced open-source relational database
- **Prisma 5.7** - Next-generation TypeScript ORM
  - Type-safe database client
  - Automated migrations
  - Database schema management
  - Prisma Studio for database GUI

### Authentication & Security
- **JWT (jsonwebtoken)** - Secure token-based authentication
- **bcrypt** - Password hashing with salt rounds
- **Passport.js** - Flexible authentication middleware
  - `passport-jwt` - JWT authentication strategy
  - `passport-local` - Local username/password strategy
- **Helmet** - Security headers middleware
- **Throttler** - Rate limiting for API protection

### Real-time Communication
- **Socket.IO 4.8** - WebSocket library for bidirectional real-time communication
  - Order status updates
  - Kitchen display notifications
  - Waiter call system
  - Live order tracking

### Payment Integration
- **VNPay** - Vietnamese payment gateway integration for online payments

### Additional Libraries
- **class-validator** - Decorator-based validation
- **class-transformer** - Plain object to class transformation
- **QRCode** - QR code generation for table access
- **PDFKit** - PDF document generation for reports
- **Archiver** - File compression for exports
- **UUID** - Unique identifier generation
- **Fuse.js** - Fuzzy search library

---

## Key Features

### Customer Features
- QR code-based table access
- Browse digital menu with categories
- Search and filter menu items
- Add items with customizable modifiers
- Real-time order tracking
- Multiple payment methods (Cash, VNPay)
- Multi-language support (Vietnamese, English)

### Staff Features
- Role-based access control (Admin, Waiter, Kitchen Staff)
- Dashboard with analytics
- Menu management (Categories, Items, Modifiers)
- Order management with status updates
- Table management with QR codes
- Kitchen display system
- User account management
- Sales reports and analytics

### Technical Features
- Real-time WebSocket updates
- JWT-based authentication
- Comprehensive validation
- Rate limiting
- Security headers
- Automated API documentation
- RESTful API architecture

---

## Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_db?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Origins (comma-separated)
CORS_ORIGINS="http://localhost:3001,http://localhost:3000"

# VNPay Payment Configuration (Optional for development)
VNPAY_TMN_CODE="your_vnpay_tmn_code"
VNPAY_HASH_SECRET="your_vnpay_hash_secret"
VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
VNPAY_RETURN_URL="http://localhost:3001/vnpay-return"

# File Upload
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_PATH="./uploads"

# Rate Limiting
THROTTLE_TTL=60000  # 1 minute
THROTTLE_LIMIT=100  # 100 requests per minute
```

### 3. Setup PostgreSQL Database

#### Option A: Using psql CLI
```bash
# Open PostgreSQL CLI
psql -U postgres

# Create database
CREATE DATABASE restaurant_db;

# Exit
\q
```

#### Option B: Using pgAdmin
1. Open pgAdmin
2. Right-click on **Databases** → **Create** → **Database**
3. Enter name: `restaurant_db`
4. Click **Save**

### 4. Setup Database Schema with Prisma

```bash
# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed database with sample data
npm run db:seed
```

---

## Development Commands

### Start Development Server

```bash
# Development mode with auto-reload
npm run start:dev

# Server runs at http://localhost:3000
```

### Database Management

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Open Prisma Studio (Database GUI)
npx prisma studio
# Access at http://localhost:5555

# Seed database with sample data
npm run db:seed

# Push schema changes without migration
npm run db:push
```
### Build & Production

```bash
# Build for production
npm run build
---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma           # Database schema definition
│   ├── migrations/             # Migration history
│   └── seed.js                 # Database seeding script
├── src/
│   ├── analytics/              # Analytics & reporting module
│   │   ├── analytics.controller.ts
│   │   └── analytics.service.ts
│   ├── auth/                   # Authentication & authorization
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── gateway/                # WebSocket gateway
│   │   ├── events.gateway.ts
│   │   └── gateway.module.ts
│   ├── kitchen/                # Kitchen display system
│   │   ├── kitchen.controller.ts
│   │   └── kitchen.service.ts
│   ├── menu/                   # Menu management
│   │   ├── categories/
│   │   │   ├── categories.controller.ts
│   │   │   └── categories.service.ts
│   │   ├── items/
│   │   │   ├── items.controller.ts
│   │   │   └── items.service.ts
│   │   ├── modifiers/
│   │   │   ├── modifiers.controller.ts
│   │   │   └── modifiers.service.ts
│   │   └── menu.module.ts
│   ├── orders/                 # Order management
│   │   ├── dto/
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   └── orders.module.ts
│   ├── payments/               # Payment processing
│   │   ├── vnpay/
│   │   │   └── vnpay.service.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   └── payments.module.ts
│   ├── prisma/                 # Prisma service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── qr/                     # QR code generation
│   │   ├── qr.service.ts
│   │   └── qr.module.ts
│   ├── tables/                 # Table management
│   │   ├── tables.controller.ts
│   │   ├── tables.service.ts
│   │   └── tables.module.ts
│   ├── users/                  # User management
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── utils/                  # Utility functions
│   ├── app.module.ts           # Root application module
│   ├── app.controller.ts       # Root controller
│   └── main.ts                 # Application entry point
├── uploads/                    # Uploaded files (images, etc.)
├── .env                        # Environment variables
├── .env.example                # Environment template
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies & scripts
```

---

## API Documentation

### Base URL
- Development: `http://localhost:3000`
- API Prefix: `/api`

### Authentication

All admin routes require JWT token in header:
```
Authorization: Bearer <token>
```

### Public Routes

#### Menu Access
```http
GET /api/menu?token=<qr_token>
```
Get menu for customer with QR token

#### Guest Menu (without login)
```http
GET /api/menu?tableId=<table_id>
```

#### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin@smartrestaurant.com",
  "password": "Admin@123"
}
```

### Protected Admin Routes

#### Categories
```http
GET    /api/admin/menu/categories          # List all categories
POST   /api/admin/menu/categories          # Create category
PATCH  /api/admin/menu/categories/:id      # Update category
DELETE /api/admin/menu/categories/:id      # Delete category
```

#### Menu Items
```http
GET    /api/admin/menu/items               # List items (with filters)
GET    /api/admin/menu/items/:id           # Get single item
POST   /api/admin/menu/items               # Create item
PATCH  /api/admin/menu/items/:id           # Update item
DELETE /api/admin/menu/items/:id           # Delete item
POST   /api/admin/menu/items/:id/photos    # Upload photos
DELETE /api/admin/menu/items/:id/photos/:photoId  # Delete photo
PATCH  /api/admin/menu/items/:id/photos/:photoId/primary  # Set primary photo
```

#### Modifiers
```http
GET    /api/admin/menu/modifiers           # List modifier groups
POST   /api/admin/menu/modifiers           # Create modifier group
PATCH  /api/admin/menu/modifiers/:id       # Update modifier group
DELETE /api/admin/menu/modifiers/:id       # Delete modifier group
```

#### Orders
```http
GET    /api/admin/orders                   # List orders
GET    /api/admin/orders/:id               # Get order details
PATCH  /api/admin/orders/:id/status        # Update order status
POST   /api/orders                         # Create order (customer)
GET    /api/orders/table/:tableId/active   # Get active orders for table
```

#### Tables
```http
GET    /api/admin/tables                   # List tables
POST   /api/admin/tables                   # Create table
PATCH  /api/admin/tables/:id               # Update table
DELETE /api/admin/tables/:id               # Delete table
POST   /api/admin/tables/:id/regenerate-qr # Regenerate QR code
```

#### Users
```http
GET    /api/admin/users                    # List users
POST   /api/admin/users                    # Create user
PATCH  /api/admin/users/:id                # Update user
DELETE /api/admin/users/:id                # Delete user
```

#### Kitchen
```http
GET    /api/kitchen/orders                 # Get orders for kitchen display
PATCH  /api/kitchen/items/:id/status       # Update order item status
```

#### Analytics
```http
GET    /api/analytics/dashboard            # Dashboard statistics
GET    /api/analytics/sales                # Sales report
GET    /api/analytics/popular-items        # Popular items report
```

### WebSocket Events

Connect to: `ws://localhost:3000`

#### Client → Server
```javascript
// Join room for updates
socket.emit('join', { room: 'order', id: orderId });
socket.emit('join', { room: 'table', id: tableId });
socket.emit('join', { room: 'kitchen' });
```

#### Server → Client
```javascript
// Order events
socket.on('order:created', (data) => { /* New order */ });
socket.on('order:statusUpdated', (data) => { /* Status changed */ });
socket.on('order:ready', (data) => { /* Order ready */ });

// Order item events
socket.on('orderItem:statusUpdated', (data) => { /* Item status */ });

// Kitchen events
socket.on('kitchen:newOrder', (data) => { /* New kitchen order */ });

// Waiter events
socket.on('waiter:called', (data) => { /* Waiter assistance */ });
```

---

## Database Schema

### Core Tables

- **User** - Staff accounts (Admin, Waiter, Kitchen Staff)
- **Table** - Restaurant tables with QR codes
- **Category** - Menu categories
- **MenuItem** - Menu items with photos
- **ItemPhoto** - Item images
- **ModifierGroup** - Customization groups (Size, Toppings, etc.)
- **ModifierOption** - Individual options in groups
- **ItemModifierGroup** - Link items to modifier groups
- **Order** - Customer orders
- **OrderItem** - Line items in orders
- **OrderItemModifier** - Selected modifiers per item
- **Payment** - Payment records

### User Roles
- `ADMIN` - Full system access
- `WAITER` - Order management
- `STAFF` - Kitchen display access

### Order Status Flow
```
PENDING → ACCEPTED → PREPARING → READY → SERVED
                  ↘ CANCELLED
```

### Item Status
- `AVAILABLE` - In stock and ready
- `UNAVAILABLE` - Temporarily unavailable
- `SOLDOUT` - Out of stock

---

## Development Notes
### Default Admin Account (after seeding)
```
Username: admin@smartrestaurant.com
Password: Admin@123
```

### Sample Data
Running `npx prisma db seed` creates:
- 1 Admin user
- 20 Tables without QR codes
- 5 Categories
- 25 Menu items
- 3 Modifier groups
- Sample orders
---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database using docker
docker compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 4. Setup Prisma
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# 5. Start development server
npm run start:dev

# Server running at http://localhost:3000
```
## License

ISC License - For educational and commercial use
