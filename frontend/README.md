# Frontend - Smart Restaurant Management System

A modern, responsive React application for restaurant management with QR-based ordering, real-time updates, and multi-language support.

---

## Technology Stack

### Core Framework
- **React 19.2** - Modern UI library with latest features
- **React Router DOM 6.30** - Declarative client-side routing
- **JavaScript (ES6+)** - Modern JavaScript features

### State Management
- **React Context API** - Global state management
  - `CartContext` - Shopping cart and order management
  - `AuthContext` - Authentication state
- **React Hooks** - useState, useEffect, useContext, custom hooks

### Internationalization (i18n)
- **react-i18next 16.5** - React integration for internationalization
- **i18next 25.7** - Powerful i18n framework
- **i18next-browser-languagedetector 8.2** - Automatic language detection
- **Supported Languages:**
  - 🇻🇳 Vietnamese (VN) - Default
  - 🇬🇧 English (EN)

### Real-time Features
- **Socket.IO Client 4.8** - WebSocket client for real-time bidirectional communication
  - Live order status updates
  - Kitchen notifications
  - Real-time order tracking
  - Custom `useSocket` hook

### HTTP Client & API
- **Axios 1.13** - Promise-based HTTP client with interceptors
- **Proxy Configuration** - Seamless API integration with backend

### Search & Filtering
- **Fuse.js 7.1** - Powerful fuzzy-search library for client-side searching

### Additional Libraries
- **QRCode.react 4.2** - QR code generation and display
- **react-to-print 3.2** - Print functionality for receipts
- **React Testing Library** - Comprehensive testing utilities

### Build Tools
- **Create React App 5.0** - Zero-configuration React setup
- **Webpack** - Module bundler (via CRA)
- **Babel** - JavaScript transpiler (via CRA)
- **ESLint** - JavaScript linting

### UI & Styling
- **CSS3** - Modern CSS features
- **CSS Custom Properties** - Dynamic theming
- **Flexbox & Grid** - Advanced layouts
- **Responsive Design** - Mobile-first approach
- **Component-scoped Styles** - Organized CSS architecture

---

## Key Features

### Customer Experience
- **QR Code Access** - Scan table QR to access menu
- **Digital Menu** - Browse categorized menu items
- **Smart Search** - Fuzzy search with instant results
- **Filter & Sort** - By category, price, name
- **Shopping Cart** - Add items with modifiers
- **Customization** - Modifier groups (size, toppings, extras)
- **Order Tracking** - Real-time status updates
- **Payment Options** - Cash and VNPay integration
- **Multi-language** - Switch between Vietnamese and English
- **Special Instructions** - Add notes to orders
- **Active Orders Banner** - View current order status

### Admin Panel
- **Authentication** - Secure JWT-based login
- **Dashboard** - Overview and statistics
- **Menu Management**
  - Categories with status control
  - Items with photos and details
  - Modifier groups and options
- **Order Management** - View and update orders
- **Table Management** - QR code generation
- **Kitchen Display** - Real-time order view
- **User Management** - Role-based access
- **Reports** - Analytics and insights

### Technical Features
- **Real-time Updates** - WebSocket integration
- **Internationalization** - Full i18n support
- **Responsive Design** - Works on all devices
- **Modern UI** - Clean and intuitive interface
- **Fast Performance** - Optimized React components
- **Secure** - Protected routes and token management
- **Context API** - Efficient state management

---

## Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- Backend server running at `http://localhost:3000`

### 1. Install Dependencies

```bash
npm install
```

If you encounter peer dependency conflicts:
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment

Create a `.env` file in the `frontend/` directory:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:3000

# WebSocket URL
REACT_APP_WS_URL=http://localhost:3000

# Development Port (optional)
PORT=4000

# Feature Flags (optional)
REACT_APP_ENABLE_ANALYTICS=true
```

### 3. Proxy Configuration

The `package.json` already includes:
```json
"proxy": "http://localhost:3000"
```
This proxies all API requests to the backend server.

---

## Development Commands

### Start Development Server

```bash
# Start dev server with hot-reload
npm run start

# Application runs at http://localhost:4000
# Browser opens automatically
```

### Build

```bash
# Build production bundle
npm run build
```

## Project Structure

```
frontend/
├── public/
│   ├── index.html              # HTML template
│   ├── manifest.json           # PWA manifest
│   └── favicon.ico             # Application icon
├── src/
│   ├── components/             # Reusable components
│   │   ├── cart/
│   │   │   ├── CartButton.js   # Floating cart button
│   │   │   ├── CartDrawer.js   # Cart sidebar
│   │   │   └── CheckoutButton.js
│   │   ├── LanguageSwitcher.js # Language toggle
│   │   ├── OrderItemModal.js   # Add to cart modal
│   │   ├── ItemModal.js        # Admin item modal
│   │   ├── Sidebar.js          # Admin sidebar
│   │   ├── PhotoManager.js     # Image upload
│   │   └── ProtectedRoute.js   # Route guard
│   ├── contexts/               # React Context providers
│   │   ├── CartContext.js      # Cart state & operations
│   │   └── (AuthContext integrated in CartContext)
│   ├── hooks/                  # Custom React hooks
│   │   └── useSocket.js        # WebSocket hook
│   ├── locales/                # Translation files
│   │   ├── en/
│   │   │   └── translation.json # English translations
│   │   └── vn/
│   │       └── translation.json # Vietnamese translations
│   ├── pages/                  # Page components
│   │   ├── MenuPage/
│   │   ├── CheckoutPage/
│   │   ├── OrderTrackingPage/
│   │   ├── PaymentSuccessPage/
│   │   ├── PaymentFailedPage/
│   │   ├── LoginPage/
│   │   ├── AdminDashboard/
│   │   ├── AdminCategoryPage/
│   │   ├── AdminItemPage/
│   │   ├── AdminModifierPage/
│   │   ├── AdminOrdersPage/
│   │   ├── AdminTablePage/
│   │   ├── AdminKitchenPage/
│   │   └── AdminAccountsPage/
│   ├── services/               # API service layer
│   │   └── api.js              # Axios instance & config
│   ├── utils/                  # Utility functions
│   │   └── formatters.js
│   ├── i18n.js                 # i18n configuration
│   ├── App.js                  # Root component & routing
│   ├── index.js                # Application entry point
│   ├── styles.css              # Global styles
│   └── custom-styles.css       # Additional global styles
├── .env                        # Environment variables
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies & scripts
└── README.md                   # This file
```

---

## Application Routes

### Customer Routes (Public)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Landing | Welcome page or redirect to menu |
| `/menu` | MenuPage | Browse menu (requires QR token) |
| `/checkout` | CheckoutPage | Order summary and payment |
| `/order-status/:orderId` | OrderTrackingPage | Live order tracking |
| `/payment/success` | PaymentSuccessPage | Payment confirmation |
| `/payment/failed` | PaymentFailedPage | Payment error page |
| `/vnpay-return` | VNPayReturn | VNPay callback handler |

### Admin Routes (Protected)

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | LoginPage | Staff authentication |
| `/admin` | AdminDashboard | Overview & statistics |
| `/admin/categories` | AdminCategoryPage | Category management |
| `/admin/items` | AdminItemPage | Menu item management |
| `/admin/modifiers` | AdminModifierPage | Modifier management |
| `/admin/orders` | AdminOrdersPage | Order management |
| `/admin/tables` | AdminTablePage | Table & QR management |
| `/admin/kitchen` | AdminKitchenPage | Kitchen display system |
| `/admin/accounts` | AdminAccountsPage | User management |
| `/admin/reports` | AdminReportsPage | Analytics & reports |

---

## Internationalization (i18n)

### Usage in Components

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('menu.title')}</h1>
      <p>{t('menu.searchPlaceholder')}</p>
      
      {/* Change language */}
      <button onClick={() => i18n.changeLanguage('en')}>
        English
      </button>
      <button onClick={() => i18n.changeLanguage('vn')}>
        Tiếng Việt
      </button>
      
      {/* Current language */}
      <p>Current: {i18n.language}</p>
    </div>
  );
}
```

### Translation File Structure

**English** (`src/locales/en/translation.json`):
```json
{
  "common": {
    "search": "Search...",
    "submit": "Submit",
    "cancel": "Cancel"
  },
  "menu": {
    "title": "Menu",
    "searchPlaceholder": "Search dishes...",
    "addToCart": "Add to Cart"
  },
  "orderItemModal": {
    "basePrice": "Base Price",
    "customizeOrder": "Customize Your Order",
    "addToOrder": "Add to Order"
  }
}
```

**Vietnamese** (`src/locales/vn/translation.json`):
```json
{
  "common": {
    "search": "Tìm kiếm...",
    "submit": "Gửi",
    "cancel": "Hủy"
  },
  "menu": {
    "title": "Thực đơn",
    "searchPlaceholder": "Tìm món ăn...",
    "addToCart": "Thêm vào giỏ"
  },
  "orderItemModal": {
    "basePrice": "Giá gốc",
    "customizeOrder": "Tùy chỉnh món ăn",
    "addToOrder": "Thêm vào giỏ"
  }
}
```

### Language Persistence
- Language preference saved in `localStorage` with key `i18nextLng`
- Automatically detects browser language on first visit
- Falls back to Vietnamese (vn) as default
- Language switcher component available: `<LanguageSwitcher />`

### Adding New Translations

1. Add key to both `en/translation.json` and `vn/translation.json`
2. Use in component: `{t('section.key')}`
3. Restart dev server if translations don't update

---

## 🔌 API Integration

### Axios Configuration

```javascript
import axios from 'axios';

// Axios instance with base URL
const api = axios.create({
  baseURL: '/api', // Proxied to http://localhost:3000/api
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Example API Calls

```javascript
// Get menu
const response = await axios.get(`/api/menu?token=${qrToken}`);

// Create order
const response = await axios.post('/api/orders', orderData);

// Admin - Get items
const response = await axios.get('/api/admin/menu/items', {
  params: { category: categoryId, page: 1, limit: 10 }
});

// Upload photo
const formData = new FormData();
formData.append('file', file);
const response = await axios.post(
  `/api/admin/menu/items/${itemId}/photos`,
  formData,
  { headers: { 'Content-Type': 'multipart/form-data' } }
);
```

---

## 🔄 Real-time Features (WebSocket)

### useSocket Hook

```javascript
import { useSocket } from './hooks/useSocket';

function OrderTracking({ orderId }) {
  const { joinRoom, on, off, isConnected } = useSocket();
  
  useEffect(() => {
    // Join room for this order
    joinRoom('order', orderId);
    
    // Listen for status updates
    const handleStatusUpdate = (data) => {
      console.log('Order status updated:', data);
      // Update UI
    };
    
    on('order:statusUpdated', handleStatusUpdate);
    
    // Cleanup
    return () => {
      off('order:statusUpdated', handleStatusUpdate);
    };
  }, [orderId, joinRoom, on, off]);
  
  return (
    <div>
      {isConnected ? '🟢 Live' : '🔴 Offline'}
    </div>
  );
}
```

### Available WebSocket Events

#### Server → Client
- `order:created` - New order created
- `order:statusUpdated` - Order status changed
- `order:ready` - Order is ready
- `orderItem:statusUpdated` - Individual item status
- `kitchen:newOrder` - New order in kitchen
- `waiter:called` - Waiter assistance requested

#### Client → Server
```javascript
// Join a room
socket.emit('join', { room: 'order', id: orderId });
socket.emit('join', { room: 'table', id: tableId });
socket.emit('join', { room: 'kitchen' });

// Leave a room
socket.emit('leave', { room: 'order', id: orderId });
```

### Responsive Breakpoints

```css
/* Mobile First Approach */

/* Base styles - Mobile (< 480px) */
.container {
  padding: 16px;
}

/* Small tablets (480px - 768px) */
@media (min-width: 480px) {
  .container {
    padding: 24px;
  }
}

/* Tablets (768px - 1024px) */
@media (min-width: 768px) {
  .container {
    padding: 32px;
  }
}

/* Desktop (> 1024px) */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

## Development Best Practices

### Component Organization
```javascript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './MyComponent.css';

// 2. Component definition
function MyComponent({ prop1, prop2 }) {
  const { t } = useTranslation();
  const [state, setState] = useState(initialValue);
  
  // 3. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);
  
  // 4. Event handlers
  const handleClick = () => {
    // Handler logic
  };
  
  // 5. Render
  return (
    <div className="my-component">
      {/* JSX */}
    </div>
  );
}

// 6. Export
export default MyComponent;
```

## Local Storage Keys

The application uses the following localStorage keys:

| Key | Type | Description |
|-----|------|-------------|
| `token` | string | JWT authentication token |
| `i18nextLng` | string | Selected language (en/vn) |
| `qrToken` | string | Table QR code token |
| `tableId` | string | Current table ID |
| `tableNumber` | string | Table number display |
| `cart` | JSON | Shopping cart items (backup) |

**Clear storage for debugging:**
```javascript
localStorage.clear();
```

## Quick Start Guide

```bash
# 1. Clone repository (if not already done)
cd menu-management/frontend

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Create environment file
echo "REACT_APP_API_URL=http://localhost:3000" > .env
echo "REACT_APP_WS_URL=http://localhost:3000" >> .env
echo "PORT=4000" >> .env

# 4. Start development server
npm start

# 5. Open browser at http://localhost:4000
```

## Customer User Flow

1. **Scan QR Code** → Redirects to `/menu?token=xxx`
2. **Browse Menu** → Search, filter by category, sort items
3. **Select Item** → Opens modal with modifiers
4. **Customize** → Choose size, toppings, add instructions
5. **Add to Cart** → Item added with selections
6. **Review Cart** → View items, adjust quantities
7. **Checkout** → Proceed to payment
8. **Place Order** → Order created and confirmed
9. **Track Order** → Real-time status updates
10. **Complete** → Order served, payment processed

---

## Admin User Flow

1. **Login** → `/login` with credentials
2. **Dashboard** → Overview of orders, sales
3. **Manage Menu:**
   - Categories → Add/edit/delete categories
   - Items → Add items with photos and modifiers
   - Modifiers → Create customization options
4. **Process Orders:**
   - View incoming orders
   - Update order status
   - Kitchen display integration
5. **Manage Tables:**
   - Add/edit tables
   - Generate QR codes
   - Print QR labels
6. **View Reports** → Sales analytics and insights

## Authentication Flow

### Login
```javascript
const handleLogin = async (credentials) => {
  try {
    const response = await axios.post('/api/auth/login', credentials);
    const { access_token, user } = response.data;
    
    // Store token
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Redirect to admin
    navigate('/admin');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Protected Routes
```javascript
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}

// Usage in App.js
<Route element={<ProtectedRoute />}>
  <Route path="/admin/*" element={<AdminLayout />} />
</Route>
```

## License

ISC License - For educational and commercial use