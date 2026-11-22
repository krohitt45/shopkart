# SHOPKART — Full-Stack MERN E-Commerce Platform
> **Tagline:** Everything You Need, Just One Click Away.  
> **Major Academic Summer Internship Project**  
> **Project Title:** Development of an E-commerce Platform  
> **Company:** SIYADNK Software Pvt. Ltd.  
> **Training Brand:** DNK Media  
> **Industry Mentor:** Mr. Amish Verma  
> **Reference Platforms:** Flipkart, Amazon, Myntra  

---

## 1. PROJECT INTRODUCTION

**ShopKart** is an enterprise-grade full-stack e-commerce web application inspired by Flipkart and Amazon. Built on the modern **MERN (MongoDB, Express.js, React.js, Node.js)** architecture, ShopKart delivers a commercial-grade shopping experience.

Unlike simple UI prototypes, ShopKart implements end-to-end full-stack capabilities including JWT authentication, role-based authorization, inventory synchronization, coupon engines, a multi-step checkout workflow with Razorpay sandbox integration, interactive order tracking with printable tax invoices, and a comprehensive administrator management portal with live analytics computed from database records.

---

## 2. PROJECT OBJECTIVES

- **Real-World Commercial Experience:** Replicate the Flipkart shopping journey with high-converting UI/UX, product cards, rating badges, category navigation, and quick checkout.
- **Robust MVC Backend Architecture:** RESTful APIs using Node.js & Express.js with centralized error handling, JWT verification, and bcrypt password hashing.
- **Resilient Dual-Mode Database:** Full Mongoose schema compliance with seamless connection to MongoDB Atlas, augmented by an embedded persistent store for instant, zero-friction demonstration.
- **Comprehensive Admin Control:** Real-time business analytics (revenue, monthly charts, top products), catalog CRUD, category management, order fulfillment, stock adjustment auditing, coupon creation, and CSV report export.
- **Security & Integrity:** Sanitized endpoints, role guards, server-side price recalculation, and stock reservation protection against race conditions.

---

## 3. KEY FEATURES

### A. Customer Website
1. **Top Announcement Bar:** Promotional banner with live coupon drops and delivery terms.
2. **ShopKart Plus Branding:** Flipkart-inspired header with sticky navigation.
3. **Smart Search with Autocomplete:** Debounced real-time product search with dropdown previews.
4. **Category Navigation Strip:** Fast access to Mobiles, Laptops, Electronics, Fashion, Home, Beauty, Grocery, Sports, Books, and Accessories.
5. **Hero Banner Carousel:** Responsive promotional slides with auto-play and manual controls.
6. **Today's Deals with Countdown Timer:** Live countdown timer showcasing flash sale discounts.
7. **Official Brands Showcase:** Apple, Samsung, Sony, Nike, Levis, Herman Miller, Dyson, and Bose.
8. **Catalog & Faceted Filtering:** 
   - Dynamic category filter
   - Brand checklist
   - Min / Max price range sliders and quick budget buttons
   - Customer ratings filter (4★ & above, etc.)
   - Dynamic sorting: Price (Low to High / High to Low), Customer Rating, Popularity, Newest
   - Pagination controls
9. **Rich Product Details Page:**
   - Multi-image gallery with active zoom and thumbnail picker
   - Brand, SKU, and Flipkart-style ratings pill
   - Real-time stock status indicator
   - PIN code delivery checker (express next-day delivery simulation)
   - Detailed specification key-value table
   - Quantity selector
   - "Add to Cart" and "Buy Now" one-click action
   - Verified customer reviews list with "Write a Review" form
   - Related products carousel
10. **Shopping Cart Management:**
    - Persistent cart (synced with database for logged-in users; cached for guests)
    - Quantity stepper (+ / -) with stock threshold guard
    - Move to Wishlist / Save for Later
    - Coupon engine: validates minimum order value, applies percentage or flat discounts
    - Automatic free delivery calculation (> ₹500)
11. **Multi-Step Checkout Flow:**
    - Step 1: Customer details & delivery address selection / Add New Address form
    - Step 2: Payment options (Cash on Delivery & Razorpay Sandbox)
    - Step 3: Order review & final confirmation
    - Confetti celebration upon successful placement!
12. **Order Management & Tracking:**
    - Visual order pipeline tracker: *Confirmed → Processing → Shipped → Out for Delivery → Delivered*
    - One-click Order Cancellation (with restock handling) for eligible orders
    - Return request submission for delivered items
    - Formatted, printable Tax Invoice with customer and item details
13. **Customer Profile:**
    - Personal information management
    - Saved multiple delivery addresses (Home / Work)
    - Password change portal
    - Order history and wishlist shortcuts

### B. Administrator Dashboard (`/admin`)
1. **Overview & Analytics:** Real calculated DB metrics (Total Revenue, Total Orders, Total Products, Total Customers, Low Stock Alerts, Monthly Revenue Trend Chart, Weekly Sales Chart, Recent Orders, and Top Selling Products).
2. **Product Management:** Full CRUD (Add Product with images, price, MRP, stock, SKU, specifications; Edit; Delete; Bulk CSV import).
3. **Category Management:** Create, edit, toggle active status, and upload category images.
4. **Order Management:** View orders, search by customer, filter by status, change status dynamically, and inspect invoices.
5. **Customer Management:** View registered users, check total orders, and block/unblock accounts.
6. **Inventory & Stock Management:** Real-time stock counts, low stock alerts (≤15 units), out of stock alerts (0 units), manual adjustments with logged reasons, and full adjustment history audit logs.
7. **Coupon Management:** Create percentage or flat discounts, set minimum cart requirements, usage limits, and expiry dates.
8. **Reviews Moderation:** Approve, hide, or delete customer reviews.
9. **Reports & Exports:** Daily, weekly, monthly, and yearly summaries with one-click downloadable Orders CSV and Products CSV files.

---

## 4. TECHNOLOGY STACK

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router DOM, Axios, Lucide React, Canvas Confetti |
| **Backend** | Node.js, Express.js (MVC Pattern), tsx execution |
| **Authentication** | JSON Web Tokens (JWT), bcrypt.js password hashing, Role-Based Access Control (RBAC) |
| **Database** | MongoDB Atlas, Mongoose ODM + Resilient Persistent Embedded Store |
| **Payments** | Razorpay REST API integration with HMAC SHA256 signature verification and sandbox testing fallback |

---

## 5. PROJECT FOLDER STRUCTURE

```
shopkart/
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── README.md
├── server.ts                    # Full-Stack Express server + Vite dev middleware
├── server/
│   ├── db.ts                    # Resilient database layer (Mongoose + persistent store)
│   ├── seed.ts                  # CLI seed runner (npm run seed)
│   ├── seedData.ts              # 30+ products, categories, demo users, orders, coupons
│   ├── types.ts                 # Backend TypeScript interfaces
│   ├── middleware/
│   │   └── auth.ts              # JWT verify, requireAuth, requireAdmin
│   ├── models/                  # Mongoose Schema definitions for Viva evaluation
│   │   └── index.ts             # User, Product, Category, Order, Cart, Wishlist, Coupon, Review
│   └── routes/
│       ├── authRoutes.ts        # Register, login, me, profile, change-password
│       ├── productRoutes.ts     # Catalog, search, filters, pagination, admin CRUD, bulk import
│       ├── categoryRoutes.ts    # Categories CRUD & product counts
│       ├── cartRoutes.ts        # User cart sync & stock checking
│       ├── wishlistRoutes.ts    # Wishlist toggle & fetch
│       ├── orderRoutes.ts       # Order placement, tracking, cancellation, restock
│       ├── paymentRoutes.ts     # Razorpay order generation & signature verification
│       ├── couponRoutes.ts      # Coupon validation & administration
│       ├── reviewRoutes.ts      # Product reviews & moderation
│       ├── adminRoutes.ts       # DB analytics, inventory logs, CSV reports
│       └── seedRoutes.ts        # Database reset API
└── src/
    ├── App.tsx                  # Client routing & providers
    ├── main.tsx                 # React entry point
    ├── index.css                # Tailwind CSS v4 tokens, fonts & animations
    ├── types.ts                 # Frontend TypeScript interfaces
    ├── services/
    │   └── api.ts               # Axios client with automatic Bearer token interceptor
    ├── context/
    │   ├── AuthContext.tsx      # Auth state, login/register, demo auto-fill
    │   ├── CartContext.tsx      # Cart items, coupon engine, totals
    │   ├── WishlistContext.tsx  # Wishlist state & toggle
    │   └── ToastContext.tsx     # Toast alert notifications
    ├── components/
    │   ├── common/              # Navbar, Footer, DemoBanner
    │   ├── home/                # HeroBanner, CategoryBar, DealsSection, FeaturedBrands
    │   └── products/            # ProductCard, FilterSidebar
    └── pages/
        ├── Home.tsx
        ├── Products.tsx
        ├── ProductDetails.tsx
        ├── Cart.tsx
        ├── Wishlist.tsx
        ├── Checkout.tsx
        ├── OrderConfirmation.tsx
        ├── OrderDetails.tsx
        ├── MyOrders.tsx
        ├── Profile.tsx
        ├── Login.tsx
        ├── Register.tsx
        ├── NotFound.tsx
        └── admin/
            ├── AdminLayout.tsx
            ├── AdminDashboard.tsx
            ├── AdminProducts.tsx
            ├── AdminCategories.tsx
            ├── AdminOrders.tsx
            ├── AdminCustomers.tsx
            ├── AdminInventory.tsx
            ├── AdminCoupons.tsx
            ├── AdminReviews.tsx
            └── AdminReports.tsx
```

---

## 6. DEMO CREDENTIALS

The application comes pre-seeded with two accounts for effortless evaluation:

| Role | Email | Password | Pre-configured Data |
|---|---|---|---|
| **Administrator** | `admin@shopkart.com` | `AdminPassword123!` | Full portal access, catalog management, inventory & analytics |
| **Customer** | `customer@shopkart.com` | `Customer123!` | Pre-seeded with past orders, wishlist items, saved Bangalore & Mumbai addresses |

> 💡 **Quick Evaluation Tip:** Use the **Demo Evaluator Bar** at the top of any page or the 1-click buttons on `/login` to switch between Admin and Customer without manual typing!

---

## 7. SAMPLE PROMOTIONAL COUPONS

| Coupon Code | Discount | Minimum Order | Details |
|---|---|---|---|
| `SHOPKART15` | **15% Off** | ₹1,999 | Up to ₹1,500 max savings |
| `WELCOME100` | **Flat ₹100 Off** | ₹500 | Available for all first orders |
| `MEGA500` | **Flat ₹500 Off** | ₹2,500 | Flat discount on medium baskets |
| `FESTIVE25` | **25% Off** | ₹4,999 | Mega festive discount up to ₹2,500 |

---

## 8. INSTALLATION & SETUP

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Steps
1. **Clone or Download the Repository:**
   ```bash
   git clone https://github.com/your-username/shopkart.git
   cd shopkart
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   *(Optional: Set your MongoDB Atlas URI or Razorpay API keys in `.env` if desired)*

4. **Seed Database:**
   ```bash
   npm run seed
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`

6. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

---

## 9. REST API DOCUMENTATION

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login & receive JWT token
- `GET /api/auth/me` — Get authenticated user details
- `PUT /api/auth/profile` — Update name, phone & saved addresses
- `PUT /api/auth/change-password` — Change password
- `POST /api/auth/forgot-password` — Generate password reset token
- `POST /api/auth/reset-password` — Reset password using token

### Products
- `GET /api/products` — Catalog query (supports category, brand, search, minPrice, maxPrice, minRating, sort, page, limit)
- `GET /api/products/:id` — Single product details & related products
- `POST /api/products` — (Admin) Add product
- `PUT /api/products/:id` — (Admin) Update product
- `DELETE /api/products/:id` — (Admin) Delete product
- `POST /api/products/bulk-import` — (Admin) Bulk import products

### Orders
- `POST /api/orders` — Place order & update inventory
- `GET /api/orders/my-orders` — User's order history
- `GET /api/orders/:id` — Order details & printable invoice
- `PATCH /api/orders/:id/cancel` — Cancel eligible order & restock items
- `PATCH /api/orders/:id/return` — Request return for delivered order

### Payments
- `POST /api/payments/create-order` — Create Razorpay order (or sandbox test order)
- `POST /api/payments/verify` — Verify cryptographic payment signature

### Admin
- `GET /api/admin/dashboard` — Live database business metrics & charts
- `GET /api/admin/orders` — Orders management
- `PATCH /api/admin/orders/:id/status` — Update order status (Shipped, Delivered, etc.)
- `GET /api/admin/users` — Customer list
- `PATCH /api/admin/users/:id/block` — Block / unblock account
- `GET /api/admin/inventory` — Stock levels & audit logs
- `PATCH /api/admin/inventory/:id` — Adjust stock quantity with reason
- `GET /api/admin/reports` — Sales reports & downloadable CSV files

---

## 10. DEPLOYMENT GUIDE

### Frontend on Vercel
1. Push project to GitHub.
2. In Vercel, import the repository with Framework Preset: `Vite`.
3. Set Build Command: `npm run build` and Output Directory: `dist`.

### Full-Stack on Render / Cloud Run
1. Connect repository to Render as a **Web Service**.
2. Build Command: `npm run build`.
3. Start Command: `npm start` (runs `tsx server.ts`).
4. Set Environment Variables: `NODE_ENV=production`, `PORT=3000`, `JWT_SECRET=your_secret`.

---

## 11. ACADEMIC VIVA & EVALUATION SUMMARY

- **Candidate Project:** ShopKart Full Stack Web Application
- **Internship Organization:** SIYADNK Software Pvt. Ltd. (DNK Media)
- **Mentor:** Mr. Amish Verma
- **Key Technical Highlights for Viva:**
  1. *Architecture:* Monolithic Full-Stack MERN with separated API routes and Vite frontend serving.
  2. *Security:* Passwords hashed using `bcryptjs` with 10 salt rounds; stateless JWT tokens with role checks.
  3. *State Management:* Context API for Auth, Cart, and Wishlist with localStorage synchronization.
  4. *Inventory Guard:* Automatic stock deduction upon checkout and instant restock when orders are cancelled.
  5. *Analytics:* Real database aggregates for revenue, top products, and monthly charts.
