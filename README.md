# Foodie — Food Delivery & Order Management System
**RaftLabs Senior Full Stack Developer Assessment Submission**

[![Node.js Version](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7+-blue.svg)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-v18+-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-v6+-646cff.svg)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-v4.21+-black.svg)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg)](https://www.mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3.4+-38bdf8.svg)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Tests-Vitest%20%26%20RTL-yellow.svg)](https://vitest.dev)

---

## 1. Project Overview

**Foodie** is an enterprise-grade, production-quality Food Delivery Order Management System engineered according to the **RaftLabs Senior Full Stack Developer Assessment**.

The application delivers a streamlined end-to-end customer journey from menu browsing, category filtering, cart management, and validated checkout to real-time order tracking and kitchen dispatch management. It includes strict server-side price validation, protected administrative order management, automatic database seeding, and extensive test coverage across backend and frontend.

---

## 2. Key Features

### A. Gourmet Menu Catalog
- **Diverse Categories**: Artisanal pizzas, gourmet smash burgers, crunchy sides, and crafted beverages.
- **Rich Product Information**: Name, description, unit price (INR), high-resolution imagery, prep time, customer rating, and veg/non-veg indicator tags.
- **Dynamic Category Filtering & Live Search**: Debounced search and instant category filtering.
- **Robust Image Fallback**: Graceful handling of image network errors with reliable food placeholders.
- **Loading, Empty, & Error States**: Contextual skeletons and error retry triggers.

### B. Shopping Cart & Local Storage Persistence
- **Cart Management**: Add items, adjust quantities with increment/decrement steppers, and remove items.
- **Persistent State**: Cart automatically persists in `localStorage` across browser refreshes and tab reloads.
- **Centralized Pricing**: Cart subtotal, fixed delivery fee (₹40), and grand total calculated centrally.
- **Empty-Cart Safeguard**: Checkout routes and buttons gracefully redirect if the basket is empty.
- **Slide-Over Drawer**: Responsive sliding cart overlay with backdrop blur.

### C. Checkout & Strict Server Price Protection
- **Customer Information Collected**: Full Name, Delivery Address, and Phone Number.
- **Indian Mobile Number Validation**: Dual-layer regex (`^(?:(?:\+|00)91[\s.-]?|0)?[6-9]\d{9}$`) accepting 10-digit formats and `+91` international prefixes.
- **Duplicate Click Prevention**: Submit buttons debounce and disable during network transmission.
- **Trusted Server-Side Price Calculation**: **The server NEVER trusts client-submitted prices or totals.** The backend fetches items directly from the database by ID, calculates exact line item costs, applies trusted delivery fees, and saves an immutable snapshot of item names and prices into the order record.
- **Unique Order Identifiers**: Generates both an internal MongoDB ObjectId and human-readable Order Numbers (e.g. `FD-YYYYMMDD-XXXX`).

### D. Order Management, Visual Timeline & Tracking
- **Order Status Lifecycle**:
  1. `ORDER_RECEIVED` (Order Received)
  2. `PREPARING` (Preparing)
  3. `OUT_FOR_DELIVERY` (Out for Delivery)
  4. `DELIVERED` (Delivered)
- **Visual Order Timeline**: Interactive timeline with step icons, active pulsing states, completed checkmarks, timestamps, and status notes.
- **Live Status Polling**: Order tracking page polls every 5 seconds until delivery completes.
- **Simulated Progression**: One-click "Advance Status" button allows reviewers and evaluators to simulate the lifecycle in real-time.
- **Status Transition Guard**: Prevents illegal transitions (e.g. jumping from received to delivered, or going backwards).

### E. Kitchen Admin Portal
- **Administrative Protection**: Protected endpoints require `x-admin-key` header or Bearer token.
- **Order Management Dashboard**: Allows authorized restaurant staff to view all orders, audit timelines, and advance kitchen statuses with validated transitions.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript 5, Vite 6, Tailwind CSS 3, React Router v7, Lucide React |
| **Backend** | Node.js (v22), Express 4, TypeScript 5, Mongoose 8, Zod 3, Helmet, CORS, Express-Rate-Limit, Morgan |
| **Database** | MongoDB Atlas / Local MongoDB / In-memory MongoDB fallback |
| **Testing** | Vitest, Supertest, React Testing Library, jsdom, mongodb-memory-server |
| **Deployment** | Vercel (Client SPA), Render (Express Web Service), MongoDB Atlas |

---

## 4. Architecture & Monorepo Structure

```
Foodie/
├── package.json               # Root scripts orchestrating client & server
├── render.yaml                # Render Infrastructure-as-Code Blueprint
├── .gitignore
├── README.md
│
├── server/                    # Backend API (Express + TypeScript + Mongoose)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── .env.example
│   └── src/
│       ├── config/
│       │   ├── env.ts         # Environment validation and typed config
│       │   └── db.ts          # MongoDB connection & auto-seeding logic
│       ├── data/
│       │   └── seedMenu.ts    # Initial gourmet menu items catalog
│       ├── models/
│       │   ├── menuItem.model.ts # Mongoose schema for food products
│       │   └── order.model.ts    # Mongoose schema for orders & snapshots
│       ├── validators/
│       │   ├── order.validator.ts# Zod schemas for order creation & status
│       │   └── menu.validator.ts # Zod schemas for menu query filtering
│       ├── services/
│       │   ├── menu.service.ts   # Menu retrieval business logic
│       │   └── order.service.ts  # Pricing, transitions & order management
│       ├── controllers/
│       │   ├── health.controller.ts
│       │   ├── menu.controller.ts
│       │   └── order.controller.ts
│       ├── middleware/
│       │   ├── auth.middleware.ts        # Admin API Key verification
│       │   └── errorHandler.middleware.ts# Centralized error handler
│       ├── routes/
│       │   ├── health.routes.ts
│       │   ├── menu.routes.ts
│       │   ├── order.routes.ts
│       │   └── index.ts
│       ├── tests/
│       │   └── api.test.ts    # Vitest + Supertest integration suite (26 tests)
│       ├── app.ts             # Express application setup (isolated for testing)
│       └── server.ts          # Server entrypoint with port listening
│
└── client/                    # Frontend SPA (React + Vite + Tailwind)
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── vitest.config.ts
    ├── tailwind.config.js
    ├── vercel.json            # Vercel SPA rewrite configuration
    ├── .env.example
    └── src/
        ├── types/             # Shared TypeScript models and interfaces
        ├── utils/
        │   ├── formatCurrency.ts # INR currency formatter
        │   └── validators.ts     # Customer form validation rules
        ├── services/
        │   └── api.ts         # Centralized HTTP API client
        ├── context/
        │   └── CartContext.tsx# React context with localStorage persistence
        ├── components/
        │   ├── Navbar.tsx
        │   ├── Footer.tsx
        │   ├── CategoryFilter.tsx
        │   ├── ProductCard.tsx
        │   ├── CartDrawer.tsx
        │   ├── OrderTimeline.tsx
        │   ├── LoadingSpinner.tsx
        │   └── ErrorMessage.tsx
        ├── pages/
        │   ├── HomePage.tsx
        │   ├── CheckoutPage.tsx
        │   ├── OrderConfirmationPage.tsx
        │   ├── OrderTrackingPage.tsx
        │   ├── AdminOrdersPage.tsx
        │   └── NotFoundPage.tsx
        ├── tests/
        │   ├── setup.ts
        │   ├── cart.test.tsx      # Cart Hook & calculation tests
        │   └── components.test.tsx# React Testing Library component tests
        ├── App.tsx
        └── main.tsx
```

---

## 5. Local Prerequisites & Installation

### Prerequisites
- **Node.js**: v18 or higher (v22 recommended)
- **npm**: v9 or higher

### Installation

Clone the repository and install dependencies:

```bash
# In the root repository directory
npm run install:all
```

Or install individual workspaces:

```bash
cd server && npm install
cd ../client && npm install
```

---

## 6. Environment Variables Reference

### Backend (`server/.env`)

Create `server/.env` with:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/foodie
CORS_ORIGIN=*
ADMIN_API_KEY=raftlabs-admin-secret-key-2026
DELIVERY_FEE=40
```

> **Note**: If a local MongoDB instance is not active, the backend automatically boots an embedded in-memory database fallback so local development and API tests work without requiring manual database installations.

### Frontend (`client/.env`)

Create `client/.env` with:

```env
VITE_API_URL=/api
```

*(During local development, Vite proxies `/api` requests to `http://localhost:5000`).*

---

## 7. Development, Test & Build Commands

### Running Locally

To run both backend and frontend concurrently from the root directory:

```bash
npm run dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000](http://localhost:5000)
- Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Running Tests

Execute the full automated test suite:

```bash
# Run both test suites
npm test

# Run backend tests only (26 tests)
npm run test:server

# Run frontend tests only (12 tests)
npm run test:client
```

### Type Checking & Linting

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

---

## 8. REST API Documentation

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Response**:
```json
{
  "success": true,
  "status": "UP",
  "timestamp": "2026-10-13T18:00:00.000Z",
  "uptime": 12.4,
  "database": {
    "status": "connected",
    "readyState": 1
  }
}
```

### 2. Get Menu Catalog
- **Endpoint**: `GET /api/menu`
- **Query Parameters**:
  - `category` *(optional)*: `pizzas` | `burgers` | `sides` | `beverages`
  - `search` *(optional)*: string
- **Response**:
```json
{
  "success": true,
  "count": 16,
  "data": [
    {
      "id": "670bf3c5...",
      "name": "Margherita Fresca Pizza",
      "description": "Classic artisanal sourdough base topped with San Marzano tomato sauce...",
      "price": 349,
      "category": "pizzas",
      "imageUrl": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3...",
      "isAvailable": true,
      "rating": 4.8,
      "prepTime": "20-25 min",
      "isVeg": true
    }
  ]
}
```

### 3. Create Order
- **Endpoint**: `POST /api/orders`
- **Request Body**:
```json
{
  "customer": {
    "name": "Aarav Sharma",
    "phone": "9876543210",
    "address": "402 Palm Grove Apartments, Indiranagar, Bengaluru"
  },
  "items": [
    { "productId": "670bf3c50000000000000001", "quantity": 2 },
    { "productId": "670bf3c50000000000000005", "quantity": 1 }
  ]
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": "670bf4e2...",
    "orderNumber": "FD-20261013-4821",
    "customer": {
      "name": "Aarav Sharma",
      "phone": "9876543210",
      "address": "402 Palm Grove Apartments, Indiranagar, Bengaluru"
    },
    "items": [
      {
        "productId": "670bf3c50000000000000001",
        "name": "Margherita Fresca Pizza",
        "price": 349,
        "quantity": 2,
        "subtotal": 698
      }
    ],
    "subtotal": 997,
    "deliveryFee": 40,
    "total": 1037,
    "status": "ORDER_RECEIVED",
    "timeline": [
      {
        "status": "ORDER_RECEIVED",
        "timestamp": "2026-10-13T18:05:00.000Z",
        "note": "Order successfully placed and verified"
      }
    ]
  }
}
```

### 4. Retrieve Order
- **Endpoint**: `GET /api/orders/:id`
- Accepts either MongoDB `_id` or human-friendly `orderNumber` (e.g. `FD-20261013-4821`).

### 5. Advance Order Status (Simulation)
- **Endpoint**: `POST /api/orders/:id/simulate`
- Advances order to next valid stage (`ORDER_RECEIVED` → `PREPARING` → `OUT_FOR_DELIVERY` → `DELIVERED`).

### 6. Kitchen Admin: List All Orders (Protected)
- **Endpoint**: `GET /api/orders?limit=50&skip=0`
- **Headers**: `x-admin-key: raftlabs-admin-secret-key-2026`

### 7. Kitchen Admin: Update Status (Protected)
- **Endpoint**: `PATCH /api/orders/:id/status`
- **Headers**: `x-admin-key: raftlabs-admin-secret-key-2026`
- **Request Body**:
```json
{
  "status": "PREPARING",
  "note": "Kitchen started wood-fire baking"
}
```

---

## 9. Deployment Guide

### A. Frontend on Vercel
1. Link your GitHub repository in the [Vercel Dashboard](https://vercel.com).
2. Set **Root Directory**: `client`.
3. Set **Build Command**: `npm run build`.
4. Set **Output Directory**: `dist`.
5. Set Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://foodie-backend-api.onrender.com/api`).
6. Deploy. `client/vercel.json` ensures client-side routing works smoothly.

### B. Backend on Render
1. Create a **New Web Service** from GitHub repo on [Render](https://render.com).
2. Root Directory: `server`.
3. Build Command: `npm install && npm run build`.
4. Start Command: `npm run start`.
5. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `CORS_ORIGIN`: Your deployed Vercel frontend URL.
   - `ADMIN_API_KEY`: A secure random secret key.
   - `DELIVERY_FEE`: `40`
6. Render Health Check Path: `/api/health`.

### C. MongoDB Atlas Database
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with read/write permissions.
3. Allow network access from Render IP addresses (`0.0.0.0/0`).
4. Copy connection URI into Render's `MONGODB_URI` environment variable.

---

## 10. Security & Architectural Decisions

1. **Server-Side Price Authority**: The client never transmits prices or totals. All calculations are performed on the server based on database records.
2. **Immutable Item Snapshots**: If product prices change later in the catalog, historical orders remain unaffected because unit prices and product names are captured at order placement time.
3. **Protected Admin Routes**: Operations modifying order status or listing sensitive customer histories require admin authentication via `x-admin-key`.
4. **Input Sanitization & Schema Validation**: Strict runtime Zod schema parsing across query params, request bodies, and database inputs.
5. **Rate Limiting & Helmet Headers**: Standard HTTP security headers and rate limits applied to mitigate abuse.
6. **Isolated Test Strategy**: API tests use an in-memory database with isolated seed data, ensuring zero side-effects on production or local databases.

---

## 11. 12–15 Minute Loom Walkthrough Script

Use this structured outline during the evaluation walkthrough:

- **00:00 – 02:00: Introduction & Architectural Overview**
  - High-level architecture: Monorepo layout (`server`, `client`), modular boundaries (controllers, services, validators, models).
  - Technology stack choices: React + Vite + TypeScript, Express + Mongoose + Zod, Tailwind CSS, Vitest.
- **02:00 – 04:30: Live Customer Journey (Menu & Cart)**
  - Browse menu items across Pizzas, Burgers, Sides, Beverages.
  - Test real-time search and category filtering.
  - Add items to the cart, show quantity updates, item removal, and localStorage persistence on page reload.
  - Review centralized pricing: line item subtotal, delivery fee, and grand total.
- **04:30 – 07:30: Checkout & Server-Side Security Verification**
  - Demonstrate field-level validation (empty inputs, invalid phone format).
  - Enter valid Indian phone number and delivery address.
  - Highlight price security: show network payload containing only product IDs and quantities, with server computing and validating total prices.
  - Place order and show duplicate-click prevention.
- **07:30 – 10:00: Order Confirmation & Live Tracking**
  - Review order confirmation page with generated Order ID (e.g. `FD-YYYYMMDD-XXXX`) and item snapshot.
  - Navigate to `/track/:orderId`.
  - Explain visual tracking timeline and 5-second polling mechanism.
  - Use the "Advance Status" button to simulate kitchen progression (`ORDER_RECEIVED` → `PREPARING` → `OUT_FOR_DELIVERY` → `DELIVERED`).
  - Demonstrate transition validation guard (preventing illegal jumps or backward status changes).
- **10:00 – 12:00: Kitchen Admin Portal & Authorization**
  - Access `/admin` route.
  - Demonstrate 401 Unauthorized protection when unauthorized.
  - Authenticate using admin API key.
  - View full orders dashboard, audit timestamps, and manage statuses.
- **12:00 – 14:00: Test Suite & Code Quality Inspection**
  - Run `npm test` demonstrating all 26 backend tests and 12 frontend tests passing cleanly.
  - Review code structure: separation of `app.ts` and `server.ts`, database auto-seeding, and error handler middleware.
- **14:00 – 15:00: Wrap-Up & Deployment Readiness**
  - Review Render blueprint (`render.yaml`) and Vercel configuration (`vercel.json`).
  - Closing remarks.

---

## 12. AI-Assisted Development Disclosure

In accordance with Section 6 of the assessment guidelines:
- **Assisted Tasks**: Initial monorepo directory scaffolding, boilerplate test writing with Supertest/React Testing Library, and curated mock menu photography data.
- **Human Verification & Validation**:
  - Every external package API was verified against installed versions.
  - Business logic, pricing math, regex phone validators, and status transition machines were tested with integration tests.
  - TypeScript types were verified with zero `any` shortcuts in application business logic.
  - All test suites (38 total tests) and production builds (`tsc`, `vite build`) were executed and verified locally.
