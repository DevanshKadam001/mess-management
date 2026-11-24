# 🍽️ Smart Canteen Ordering & Inventory Management System

A modern, responsive, full-stack campus canteen ordering, kitchen management, and ingredient-based inventory tracking platform.

Built with **React (TypeScript)**, **Tailwind CSS**, **Node.js (Express)**, **Prisma ORM**, **Socket.IO** (real-time live order updates), and **Recharts**.

---

## 🚀 Quick Start (How to See the Output)

### 1. Start Both Backend & Frontend Simultaneously
In your project root directory, run:
```bash
npm start
```
*(Or run `node start-all.js`)*

Alternatively, you can run them in two separate terminal windows:
- **Terminal 1 (Backend API & Socket.IO Server):**
  ```bash
  cd backend
  npm run dev
  ```
  Backend starts on `http://localhost:5000`

- **Terminal 2 (Frontend React App):**
  ```bash
  cd frontend
  npm run dev
  ```
  Frontend starts on `http://localhost:5173`

### 2. Open the Application in your Browser
Navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 Demo Login Credentials

The database is pre-seeded with realistic campus users, stalls, dishes, recipes, inventory records, and active orders.

> 💡 **Quick Role Switcher:** A floating pill in the bottom-right corner of the application allows you to switch between Student, Faculty, Vendor 1, Vendor 2, and Admin in **1 click** without typing passwords!

| Role | Name & Details | Email | Password |
|---|---|---|---|
| **Administrator** | Prof. Sharma (Campus Admin) | `admin@canteen.edu` | `Password123!` |
| **Vendor 1** | Ramesh Gupta (*Annapurna Delights*) | `vendor1@canteen.edu` | `Password123!` |
| **Vendor 2** | Kavita Singh (*Cafe Zest*) | `vendor2@canteen.edu` | `Password123!` |
| **Student 1** | Aarav Patel (Computer Science) | `student1@canteen.edu` | `Password123!` |
| **Student 2** | Ananya Iyer (Electrical) | `student2@canteen.edu` | `Password123!` |
| **Faculty 1** | Dr. Vikram Joshi (CS Faculty) | `faculty1@canteen.edu` | `Password123!` |

*(All sample accounts use the password: `Password123!`)*

---

## ✨ Features by Role

### 👨‍🎓 1. Student / Faculty Ordering Experience
- **Interactive Home & Menu:** Browse campus food stalls (*Annapurna South & North Delights*, *Cafe Zest*).
- **Filtering & Search:** Real-time search, category tabs (Breakfast, Lunch, Snacks, Beverages, Desserts), and Veg / Non-Veg toggles.
- **Detailed Dish Modal:** View preparation times, calorie counts, descriptions, and linked fresh ingredients.
- **Shopping Cart Drawer:** Add/remove items, adjust quantities, calculate subtotal, and automatic 5% GST calculation.
- **Secure Checkout:**
  - Mock **UPI QR Code** simulation with instant approval verification.
  - **Cash on Counter Pickup** option.
  - Special preparation instructions / notes for the kitchen.
  - Generates a **unique 4-digit Counter Pickup OTP** (e.g. `4821`) and Order ID.
- **Live Order Progress Tracker:** Real-time visual timeline connected via Socket.IO:
  1. *Order Placed*
  2. *Order Accepted*
  3. *Preparing / Cooking*
  4. *Ready for Collection* (with sound chime & counter alert)
  5. *Collected / Completed*
- **Order History & Receipts:** Review previous orders and download or print official tax invoices.
- **Profile Management:** Update phone number, department, and hostel/room number.

---

### 👨‍🍳 2. Canteen Vendor Dashboard
- **Executive Overview:** 5 live KPI cards (Today's Revenue, Total Orders, Pending Live Orders, Available Food Items, Low-Stock Warnings).
- **Weekly Revenue Chart:** Interactive visual area chart powered by Recharts.
- **Live Order Management Board:**
  - Accept or reject incoming orders in real-time.
  - **Automated Recipe Ingredient Deduction:** When an order is accepted or moved to preparation, raw ingredients (batter, oil, paneer, veggies, coffee) are automatically deducted from inventory according to product recipes.
  - Counter Pickup Verification: Vendor inputs customer's 4-digit OTP to verify and mark food collected.
- **Menu & Recipe Builder:**
  - Add and edit food items with images, prices, categories, and prep times.
  - 1-click toggle to show or hide out-of-stock items.
  - **Define ingredient quantities required per serving** to automate inventory consumption.
- **Ingredient Inventory Management:**
  - Track stock levels with color-coded health bars (In Stock, Low Stock, Out of Stock).
  - Quick **Restock** (+quantity, purchase cost, vendor note).
  - Manual **Stock Adjustment / Wastage** logging.
  - Complete **Inventory Transaction Audit Ledger**.
- **Billing & Export Reports:**
  - Daily, weekly, and monthly revenue analytics.
  - **Downloadable Sales CSV Reports**.
  - **Downloadable Inventory Stock CSV Reports**.
- **Stall Settings:** Toggle stall open/closed status, update stall branding and counter location.

---

### 🛡️ 3. Campus Administrator Dashboard
- **System Telemetry:** Cross-stall total revenue, today's revenue, active vendors count, student count, and 30-day sales curves.
- **Order Status Breakdown:** Donut chart showing distribution across kitchen statuses.
- **User Directory:** Filter by role (Student, Faculty, Vendor, Admin), change roles, and activate/deactivate accounts.
- **Vendor Stalls Management:** Monitor stall revenues, active dish counts, and operational status.
- **System-Wide Orders Monitor:** Inspect all orders across all stalls with live status filters.
- **Food Category Management:** Create, edit, and delete food categories with icons.
- **Audit Logs:** Unified real-time chronological activity feed of orders and inventory transactions.

---

## 🏗️ Architecture & Database Design

### Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Canvas-Confetti, Socket.IO Client.
- **Backend:** Node.js, Express.js, JWT Authentication, Multer, Socket.IO Server, Zod.
- **Database:** Prisma ORM with SQLite (zero external installation required) / easily switchable to PostgreSQL by updating `datasource db { provider = "postgresql" }`.

### Relational Schema Models
1. **User:** Authentication, roles, campus departments, and profiles.
2. **Vendor:** Food court stalls and counter profiles.
3. **Product:** Food menu items with prices, categories, and availability.
4. **Category:** Food categorization.
5. **Ingredient:** Raw stock records (stock level, unit, min threshold, unit cost).
6. **ProductIngredient:** Recipe linkages defining ingredient quantity required per dish.
7. **Cart & CartItem:** User shopping cart.
8. **Order & OrderItem:** Customer orders with snapshots of unit prices, 4-digit pickup OTP, and status.
9. **Payment:** UPI transaction verification and Cash payment tracking.
10. **InventoryTransaction:** Audit logs for Restock, Order Consumption, Manual Adjustments, and Wastage.
11. **Notification:** Real-time push and persistent in-app notifications.

---

## 🧪 Testing Workflows Step-by-Step

### Workflow 1: Place an Order as a Student
1. Open [http://localhost:5173](http://localhost:5173).
2. Click **Demo: Select Role** at bottom-right and select **Student (Aarav)**.
3. Browse the menu and click **Add** on *Crispy Masala Dosa* and *Degree Filter Coffee*.
4. Open the **Cart Drawer** on the right and click **Proceed to Checkout**.
5. Select **UPI Payment** (click *Simulate Instant UPI Approval*) or **Pay Cash at Counter**.
6. Click **Place Order Now**.
7. Enjoy the celebration confetti and note your **Counter Pickup OTP** (e.g. `4821`).

### Workflow 2: Process Order & Deduct Inventory as Vendor
1. Click the **Demo Switcher** at bottom-right and select **Vendor 1 (Annapurna)**.
2. Click **Vendor Dashboard** in the top navigation.
3. Go to **Live Orders Management** — notice the newly placed order!
4. Click **Accept Order** — watch the ingredient inventory (Dosa batter, butter, coffee powder) automatically deduct.
5. Click **Start Cooking** -> **Mark Ready**.
6. Switch back to **Student** in another tab or the demo switcher to see the real-time tracker update to *Ready for Collection*!
7. As vendor, click **Verify OTP & Hand Over**, enter the 4-digit code, and click **Verify & Complete**.

### Workflow 3: Admin Overview & Inventory Restock
1. Switch to **Administrator (Campus Admin)**.
2. Click **Admin Panel** to see system-wide telemetry, 30-day graphs, and user management.
3. Switch back to **Vendor 1**, visit **Inventory & Ingredients**, and click **Restock** on any item to replenish quantities.
4. Go to **Sales & Billing Reports** and click **Export Sales CSV** to download data.
