# ⚡ TechHaven — Modern Tech & Gadgets E-Commerce Store

TechHaven is a full-featured e-commerce platform built for high-performance audio, computing, wearables, and mechanical peripherals. It includes a complete storefront, cart management, checkout flow, database persistence with **Neon PostgreSQL**, email notifications powered by **Mailgun**, and Google Single Sign-On via **Google Cloud Console OAuth 2.0**.

---

## 🌟 Key Features

* **Storefront & Catalog**:
  * Rich tech product catalog (laptops, wireless ANC headphones, smartwatches, 4K displays, mechanical keyboards).
  * Real-time category filtering (Audio, Computers, Peripherals, Wearables, Displays, Accessories) and search.
  * Quick-view interactive modal with technical specifications and stock indicators.
* **Persistent Cart Experience**:
  * Slide-over cart drawer with quantity selectors and item removal.
  * Live subtotal calculation and free shipping milestone progress bar.
  * `localStorage` persistence across page reloads and checkout transitions.
* **Checkout Flow**:
  * Pre-fill recipient and contact information directly via Google Sign-In session.
  * Shipping details validation with international shipping support.
  * Simulated payment card input with real-time test validation.
  * Order review sidebar with price breakdown (subtotal, free shipping threshold, 8% tax, total).
* **Database Persistence (Neon PostgreSQL)**:
  * Persistent storage for `products`, `orders`, and `order_items` via `@neondatabase/serverless`.
  * Atomic order placement and inventory stock decrementing.
  * Automatic table schema creation and product seeding endpoint (`/api/seed`).
  * Seamless local fallback when `DATABASE_URL` is not yet configured.
* **Email Confirmation (Mailgun API)**:
  * Transactional email dispatched on order placement via `mailgun.js`.
  * Polished, responsive HTML receipt containing order reference, itemized breakdown, customer address, and total amount.
  * Development simulation fallback when API keys are not yet configured.
* **Google Authentication (Google Cloud Console)**:
  * NextAuth.js (Auth.js v5) configured with Google OAuth 2.0.
  * Header user profile badge, avatar display, and session management.

---

## 🛠️ Tech Stack Architecture

* **Frontend**: Next.js 15 (App Router, React 19, TypeScript, Tailwind CSS, Lucide Icons)
* **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
* **Email Delivery**: Mailgun API (`mailgun.js` + `form-data`)
* **Authentication**: NextAuth.js (Auth.js) with Google Provider

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Open `.env.local` and add your service credentials:

#### A. Neon Database (`DATABASE_URL`)
1. Create a free PostgreSQL database at [Neon](https://console.neon.tech).
2. Copy your connection string into `.env.local`:
   ```env
   DATABASE_URL="postgres://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
3. Visit `http://localhost:3000/api/seed` in your browser to initialize tables and seed products.

#### B. Google Cloud Console OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
1. Visit [Google Cloud Console](https://console.cloud.google.com).
2. Navigate to **APIs & Services** > **Credentials**.
3. Create an **OAuth 2.0 Client ID** (Application type: **Web application**).
4. Add the Authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
5. Copy the Client ID and Client Secret into `.env.local`:
   ```env
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   NEXTAUTH_SECRET="your-generated-random-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

#### C. Mailgun API (`MAILGUN_API_KEY`, `MAILGUN_DOMAIN`)
1. Sign up or log into [Mailgun](https://app.mailgun.com).
2. Retrieve your **Sending Domain** (sandbox or verified custom domain) and **Private API Key**.
3. Add to `.env.local`:
   ```env
   MAILGUN_API_KEY="your-mailgun-api-key"
   MAILGUN_DOMAIN="sandbox-xxx.mailgun.org"
   MAILGUN_HOST="api.mailgun.net"
   MAILGUN_FROM_EMAIL="TechHaven Orders <orders@your-domain.mailgun.org>"
   ```

---

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing the Complete Flow

1. **Browse & Cart**: Add tech gear from the home page catalog to your cart.
2. **Google Sign-In**: Click "Google Sign In" in the header to authenticate.
3. **Checkout**: Click "Proceed to Checkout" or navigate to `/checkout`. Your name and email will be pre-filled from your Google account.
4. **Order Confirmation**: Click "Place Order". The order will be saved to Neon, Mailgun will trigger the confirmation email receipt, and you will be routed to the confirmation success screen (`/checkout/success`).
