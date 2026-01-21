# 🍽️ Smart Restaurant Management System

[![NestJS](https://img.shields.io/badge/backend-NestJS%2010-E0234E?style=flat&logo=nestjs)](https://nestjs.com/)
[![React](https://img.shields.io/badge/frontend-React%2019-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive, full-stack solution designed to modernize restaurant operations through digital menu management, QR-based ordering, and real-time staff coordination.

---

## 📖 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Overview](#-api-overview)
- [Database Schema](#-database-schema)
- [Vietnamese Description](#-tiếng-việt)

---

## ✨ Features

### 📋 Table & QR Management
- **Interactive Grid**: Visual representation of the restaurant layout.
- **Dynamic QR Generation**: Secure, token-based QR codes for each table.
- **Real-time Status**: Live tracking of table availability (Available, Occupied, Reserved).

### 🍱 Advanced Menu Management
- **Categorization**: Full CRUD for menu categories with custom display ordering.
- **Item Details**: Manage pricing, preparation time, and "Chef's Recommendations".
- **Stock Control**: Real-time availability toggles (`Available`, `Unavailable`, `Sold out`).
- **Modifier Groups**: Flexible options for items (e.g., custom sizes, extra toppings).
- **Media Gallery**: Cloudinary-integrated photo management with primary image selection.

### 🛡️ Admin & Staff Tools
- **Robust Authentication**: Secure login for Admin and Kitchen Staff.
- **Analytics Dashboard**: Track popularity, sales (based on project progress).
- **Real-time Notifications**: Socket.io integration for instant order updates between guest and kitchen.

### 🌐 Localization
- **Multilingual Support**: Fully localized in **English** and **Vietnamese** using `i18next`.

---

## 🚀 Tech Stack

### Backend
- **Core**: NestJS (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Security**: JWT & Passport
- **Real-time**: Socket.io
- **Storage**: Cloudinary (Image Hosting)
- **Communication**: Brevo/Resend/Nodemailer (Email Services)

### Frontend
- **Framework**: React 19
- **State/Routing**: React Router v6
- **API Client**: Axios
- **Real-time**: Socket.io-client
- **Internationalization**: i18next
- **Styling**: Vanilla CSS (Custom Responsive Design)

---

## 🏗️ Project Structure

```bash
menu-management/
├── backend/          # NestJS Server & API
│   ├── src/          # Source code (controllers, services, gateways)
│   ├── prisma/       # Database schema & migrations
│   └── .env.example  # Backend environment template
├── frontend/         # React Application
│   ├── src/          # Components, Pages, Contexts
│   ├── public/       # Static assets
│   └── .env.example  # Frontend environment template
└── README.md         # Documentation
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- Docker (for local PostgreSQL)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd menu-management
   ```

2. **Environment Setup**
   - Create `.env` files in both `backend/` and `frontend/` based on their respective `.env.example` files.

3. **Database Setup**
   ```bash
   # In the root or backend directory
   docker-compose up -d
   cd backend
   npm install
   npx prisma db push
   npx prisma db seed # Optional: Seed initial data
   ```

4. **Running the Application**
   - **Backend**: `npm run start:dev`
   - **Frontend**: `cd ../frontend && npm install && npm start`

---

## 🗺️ API Overview

| Feature | Method | Endpoint |
| :--- | :--- | :--- |
| **Guest Menu** | `GET` | `/api/menu` |
| **Admin Items** | `GET/POST` | `/api/admin/menu/items` |
| **Categories** | `GET/POST` | `/api/admin/menu/categories` |
| **Tables** | `GET/PATCH` | `/api/tables` |
| **QR Verify** | `POST` | `/api/qr/verify` |

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Created as part of the Web Application Development (WAD) Course - 2025-2026.*
