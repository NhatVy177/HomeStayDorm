# 🏠 HomeStayDorm – Dormitory & Homestay Room Rental Management System

> Practical project for the **Information Systems Analysis and Design (ISAD)** course  
> Faculty of Information Technology – University of Science, VNU-HCM  
> 🔗 Live demo: [home-stay-dorm.vercel.app](https://home-stay-dorm.vercel.app)

An end-to-end management system for a private dormitory (HomeStay Dorm) covering the full tenant lifecycle — from room browsing and deposit placement, through contract signing and check-in, to checkout reconciliation and deposit refund.

---

## 📌 Introduction

### Problem Statement

Managing a multi-branch private dormitory with manual processes leads to significant operational challenges: tracking room/bed availability across branches is error-prone, deposit and contract workflows rely on paper-based records that are easily lost, and financial reconciliation during checkout (calculating refund percentages, deducting damages, outstanding bills, and penalties) is time-consuming and dispute-prone. This system digitizes the entire rental lifecycle to ensure accuracy, traceability, and operational efficiency.

### Scope

**In scope:**
- Room/bed browsing and rental registration
- Deposit placement, payment processing, and deposit receipt management
- Lease contract signing, check-in, and room/asset handover
- Monthly billing (rent, utilities, services)
- Checkout inspection, financial reconciliation, and deposit refund
- System administration (users, branches, rooms, beds, services, assets, rules)
- Role-based access control with multi-role support

**Out of scope:**
- Online payment gateway integration (payments are recorded manually)
- Mobile native application

### How the System Works

A quick overview of the operational flow by role:

- **Customer:** browse available rooms → submit a rental registration request → schedule a room viewing → place a deposit → sign the lease contract → check in → pay monthly bills → request checkout
- **Sale Staff:** process rental registration requests, schedule room viewings, check room/bed availability, initiate deposit workflows, coordinate check-in procedures
- **Branch Manager:** verify deposit receipts, approve residency eligibility, conduct room inspections (check-in & checkout), manage asset handover, process checkout and contract termination
- **Accountant:** calculate deposit amounts, confirm deposit payments, generate monthly utility bills, perform checkout financial reconciliation (refund percentage, deductions, penalties), process deposit refunds
- **Admin:** manage system-wide catalogs — users, branches, room types, rooms, beds, services, assets, rules, and violation terms

### 🎬 Quick Preview

| 🔍 Room Discovery & Smart Filters | 🛋️ Room Details & Booking Action |
|:---:|:---:|
| [![Room Discovery](docs/screenshots/room_discovery.png)](docs/screenshots/room_discovery.png) | [![Room Details & Booking](docs/screenshots/room_detail_booking.png)](docs/screenshots/room_detail_booking.png) |
| *Real-time branch, price, and room-type filtering* | *Interactive 360° details, amenities, and instant deposit CTA* |

> 🌐 **Live Application**: Try the full tenant experience live at [home-stay-dorm.vercel.app](https://home-stay-dorm.vercel.app)  
> 🔑 **Demo Account**: Username `kh0011` · Password `123` (Customer role)

---

## 👥 Team Information

**Group 10** — Faculty of Information Technology, University of Science, VNU-HCM

| Student ID | Full Name | Role & Contributions |
|---|---|---|
| 23120192 | Nguyễn Nhật Vy | Project Leader, Lead Tester & UI/UX Designer. System Analyst: Use Cases, Sequence & 3-Tier Class Diagrams. Full-Stack Developer: General Interface, Room Discovery, Booking Flow & Settlement. |
| 23120300 | Nguyễn Trà My | Database Designer (ERD) & Data Specialist (Mock Data). System Analyst: Sequence & 3-Tier Class Diagrams. Full-Stack Developer: Checkout Flow. |
| 23120198 | Nguyễn Nhựt Thanh | Database Designer (ERD). System Analyst: Sequence & 3-Tier Class Diagrams. Full-Stack Developer: Check-in Flow. |
| 23120206 | Ngô Thuận An | System Analyst: Sequence & 3-Tier Class Diagrams. Full-Stack Developer: Deposit Flow. |
| 23120218 | Nguyễn Ngọc Bình | Data Specialist (Mock Data). System Analyst: Sequence & 3-Tier Class Diagrams. Full-Stack Developer: Schedule Management & Admin Dashboard. |

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite (SPA with vanilla CSS)
- **Backend:** Node.js + Express.js (RESTful API)
- **Database:** PostgreSQL (hosted on Supabase) — migrated from initial MSSQL design
- **Authentication:** JWT-based with role-based access control
- **Deployment:** Vercel (frontend) + Supabase (database & connection pooling)
- **Diagramming tools:** Enterprise Architect, draw.io
- **UI Prototyping:** Google Stitch (AI-generated HTML mockups as design reference)

### 🔄 Engineering Highlight: MSSQL to PostgreSQL (Supabase) Migration

> *A real-world engineering case study demonstrating adaptability, database internals proficiency, and zero-downtime architectural transition.*

The system was initially modeled and scripted for **Microsoft SQL Server (MSSQL)** with complex stored procedures, multi-table result sets, and table-valued parameters. To deploy efficiently to the cloud with Supabase and Vercel, the team engineered a comprehensive database migration:

| Challenge | Architectural Impact | Solution Implemented |
|---|---|---|
| **Dialect Divergence** | T-SQL functions (`ISNULL`, `GETDATE()`, `SELECT TOP N`, `OUTER APPLY`) are incompatible with PostgreSQL syntax. | Implemented an automated query translation layer in `connection.js` that converts T-SQL syntax on-the-fly to standard PostgreSQL (`COALESCE`, `CURRENT_TIMESTAMP`, `LIMIT`, `LEFT JOIN LATERAL`). |
| **Case-Sensitivity & Alias Folding** | PostgreSQL folds unquoted column aliases to lowercase, breaking frontend camelCase API contracts (`maPhieuCoc` became `maphieucoc`). | Designed an AST-regex pre-processor that auto-quotes column aliases in `SELECT` expressions (`AS "maPhieuCoc"`) while preserving SQL types in `CAST` and keeping table aliases unquoted for case-insensitive resolution. |
| **Multiple Tabular Result Sets** | MSSQL procedures returned up to 10 distinct result sets in a single call (unsupported natively in PostgreSQL). | Decomposed monolithic stored procedures into concurrent, connection-pooled queries orchestrated via `Promise.all` with transactional consistency. |
| **Schema & Data Migration** | 34 relational tables with custom check constraints, foreign keys, and seed data. | Converted schema DDL, translated trigger functions to PL/pgSQL, and verified data integrity across all 5 operational user roles. |

---

## 📄 Project Documents

Full specifications, analysis, and design documentation:

- **Project specification (PDF):** [`FIT_4.0_DATH_PTTK HTTT_2526.pdf`](docs/references/FIT_4.0_DATH_PTTK%20HTTT_2526.pdf)
- **Full design report (PDF):** [`10_BaoCao.pdf`](docs/references/10_BaoCao.pdf) — detailed use case specifications, activity diagrams, class diagrams, sequence diagrams, ERD, UI prototypes

---

## 🏗️ System Architecture

The system follows a **3-Layer Architecture** (Presentation – Business Logic – Data Access), implemented as a client-server web application.

```mermaid
flowchart TB
    subgraph Presentation ["🖥️ Presentation Layer"]
        direction TB
        UI["React SPA (Vite)"]
        Pages["Pages: Auth · Room Discovery · Rental Registration\nDeposit · Check-in · Checkout · Admin Dashboard"]
    end

    subgraph Business ["⚙️ Business Logic Layer"]
        direction TB
        API["Express.js REST API"]
        Services["Services: DangKyThue · DatCoc · NhanPhong\nTraPhong · DoiSoat · Admin"]
        MW["Middleware: JWT Auth · Role Guard · File Upload"]
    end

    subgraph Data ["🗄️ Data Access Layer"]
        direction TB
        Repo["Repositories / Query Builders"]
        SP["Stored Procedures & Triggers"]
        DB[("PostgreSQL\n(Supabase)")]
    end

    UI --> Pages
    Pages -- "HTTP/JSON" --> API
    API --> MW --> Services
    Services --> Repo
    Repo --> SP --> DB
```

### Layer Mapping to Codebase

| Layer | Technology | Directory |
|---|---|---|
| Presentation | React + Vite + CSS | `web/frontend/src/` |
| Business Logic | Express.js + Services | `web/backend/services/` + `web/backend/controllers/` |
| Data Access | pg (node-postgres) + SQL | `web/backend/repositories/` + `database/` |

---

## 📊 Business Analysis & Use Cases

### Actors

1. **Customer (Khách hàng)** — End-user who browses rooms, submits rental registration, places deposits, signs lease contracts, and requests checkout.
2. **Sale Staff (Nhân viên Sale)** — Handles rental registrations, schedules room viewings, checks room availability, coordinates deposit and check-in workflows.
3. **Branch Manager (Nhân viên Quản lý)** — Verifies deposit receipts, approves residency eligibility, conducts room inspections, manages asset handover, processes checkout.
4. **Accountant (Nhân viên Kế toán)** — Calculates deposits, confirms payments, generates bills, performs checkout financial reconciliation, processes refunds.
5. **System Administrator (Quản trị viên)** — Manages system catalogs: users, branches, rooms, beds, room types, services, assets, rules, and violation terms.

### Business Use Cases

The system models **10 core business processes**, each fully specified with main flows, alternative flows, and activity diagrams:

| # | Business Use Case | Business Workers | Business Entities |
|---|---|---|---|
| 1 | Rental Registration | Sale Staff | Customer, Registration Form, Bed, Room, Viewing Schedule |
| 2 | Room Viewing | Sale Staff | Viewing Schedule, Room, Bed, Rules |
| 3 | Deposit Placement & Rental Confirmation | Sale Staff, Manager | Customer, Room, Bed, Deposit Receipt, Rules |
| 4 | Deposit Payment | Accountant, Sale Staff, Manager | Room Type, Deposit Receipt, Room, Bed |
| 5 | Rental Info Update | Sale Staff, Manager | Room, Contract, Rules, Tenant |
| 6 | Check-in | Sale Staff, Manager | Deposit Receipt, Contract Members |
| 7 | Lease Contract Signing | Staff-in-Charge, Accountant | Customer, Rules, Contract Members, Room Type, Room, Bed, Lease Contract, Contract Details, Invoice |
| 8 | Room & Asset Handover | Manager | Room, Equipment, Handover Report, Rules |
| 9 | Checkout Processing | Sale Staff, Manager | Lease Contract, Deposit Receipt, Room Inspection Report, Handover Report, Room, Bed, Contract Members |
| 10 | Checkout Settlement | Accountant, Manager | Lease Contract, Deposit Receipt, Refund Rules, Room Inspection Report, Violation Report, Invoice, Reconciliation, Checkout Report |

### System Use Case Diagram

[![System Use Case Diagram](docs/diagrams/system-usecase.jpg)](docs/diagrams/system-usecase.jpg)

The system implements **40+ system-level use cases** covering all core requirements. Full use case specifications (actors, preconditions, main/alternative flows, exceptions, post-conditions) are available in the [design report](docs/references/10_BaoCao.pdf).

### Key System Use Cases by Module

<details>
<summary><strong>🔍 Rental Registration & Room Viewing (Đăng ký thuê & Xem phòng)</strong></summary>

- Process rental registration request
- Check room/bed availability
- Search room/bed listings
- Schedule room viewings
- Browse room viewing schedule
- Look up personal viewing schedule

</details>

<details>
<summary><strong>💰 Deposit & Payment (Đặt cọc & Thanh toán)</strong></summary>

- Submit deposit request
- Record deposit payment voucher
- Create deposit receipt
- Confirm deposit payment capability
- Confirm deposit payment
- Settle deposit payment

</details>

<details>
<summary><strong>🏠 Check-in & Contract (Nhận phòng & Hợp đồng)</strong></summary>

- Record tenant residency info
- Approve residency eligibility
- Create lease contract
- Record check-in charges
- Create room handover report
- Look up contract details

</details>

<details>
<summary><strong>🚪 Checkout & Settlement (Trả phòng & Hoàn cọc)</strong></summary>

- Submit checkout request
- Register checkout schedule
- Room checkout inspection
- Create checkout reconciliation report
- Confirm reconciliation result / Customer feedback
- Process reconciliation response
- Record deposit refund
- Record additional charges
- Record file liquidation
- Record handover-out

</details>

<details>
<summary><strong>🔐 Authentication</strong></summary>

- Register account
- Login (includes "Check existing account")
- Logout

</details>

<details>
<summary><strong>⚙️ System Administration</strong></summary>

- Manage users
- Manage room assets
- Manage system parameters
- Backup & restore
- Manage beds, rules, services, rooms, branches

</details>

### 3-Tier Class Diagrams

The system design includes **3-tier class diagrams** (Presentation – Business Logic – Data Access) for each major business flow:

1. **Rental Registration Flow** — Classes for rental form handling, room matching logic, and registration data persistence
2. **Deposit Flow** — Classes for deposit calculation, payment confirmation, and deposit receipt management
3. **Check-in Flow** — Classes for residency verification, contract generation, and handover documentation
4. **Checkout & Settlement Flow** — Classes for room inspection, financial reconciliation, refund processing, and contract termination

### Sequence Diagrams

Detailed sequence diagrams are provided for each system use case, illustrating the interaction between:
- **Boundary classes** (UI screens and forms)
- **Control classes** (business logic controllers)
- **Entity classes** (data access objects)

All sequence diagrams follow the 3-tier architecture pattern and are documented in the [full report](docs/references/10_BaoCao.pdf), Section 2.5.

---

## 🗄️ Database Design (ERD)

The relational database consists of **34 tables** organized into the following logical groups:

| Group | Tables |
|---|---|
| **Organization** | `ChiNhanh` (Branch), `LoaiPhong` (Room Type) |
| **Users & Auth** | `NguoiDung` (User), `NhanVien` (Employee), `KhachHang` (Customer), `TaiKhoan` (Account) |
| **Rooms & Assets** | `Phong` (Room), `HinhAnhPhong` (Room Image), `Giuong` (Bed), `TaiSan` (Asset), `DichVu` (Service) |
| **Registration & Viewing** | `PhieuDangKy` (Registration Form), `PDK_LoaiPhong` (Reg. Room Preference), `LichXemPhong` (Viewing Schedule), `ChiTietXemPhong` (Viewing Detail) |
| **Deposit** | `PhieuDatCoc` (Deposit Receipt), `ChiTietDatCoc` (Deposit Detail) |
| **Contract & Tenancy** | `HopDongThue` (Lease Contract), `DichVuHopDong` (Contract Service), `ThanhVienHopDong` (Contract Member) |
| **Handover** | `BienBanBanGiao` (Handover Report), `ChiTietBanGiao` (Handover Detail) |
| **Billing** | `PhieuGhiChiSo` (Meter Reading), `HoaDon` (Invoice), `ChiTietHoaDon` (Invoice Detail) |
| **Checkout & Settlement** | `PhieuTraPhong` (Checkout Form), `BienBanKiemTraPhong` (Room Inspection), `ChiTietHuHong` (Damage Detail), `QuyDinhHoanCoc` (Refund Rules), `DoiSoat` (Reconciliation) |
| **Rules & Violations** | `QuiDinh` (Rules), `DieuKhoanViPham` (Violation Terms), `BienBanViPham` (Violation Report) |
| **Maintenance** | `YeuCauSuaChua` (Repair Request) |

Full ERD and schema details are available in the [design report](docs/references/10_BaoCao.pdf), Section 2.1.

---

## 🎨 UI Design

Initial UI mockups were designed with **Google Stitch** (AI-powered HTML generation) and used as a wireframe reference throughout development. These mockups documented the design intent for each screen before coding began, following the workflow: **Research → Mockup → Code**.

See [`docs/mockups/`](docs/mockups) for the original HTML design files covering:
- Home page & room discovery
- Room detail view & booking
- Deposit receipt & payment confirmation
- Check-in & handover forms
- Checkout inspection & settlement
- Monthly billing

### 📸 Production UI Gallery

| 🏠 Landing Page & Hero Banner | 🔍 Room Catalog & Dynamic Filters | 🛏️ Room Detail & Instant Booking |
|:---:|:---:|:---:|
| [![Home](docs/screenshots/homepage_hero.png)](docs/screenshots/homepage_hero.png) | [![Discovery](docs/screenshots/room_discovery.png)](docs/screenshots/room_discovery.png) | [![Detail](docs/screenshots/room_detail_booking.png)](docs/screenshots/room_detail_booking.png) |

---

## 📁 Project Structure

```
HomeStayDorm/
├── docs/
│   ├── diagrams/        # Use case, sequence, class diagram, ERD exports (PNG/PDF)
│   ├── mockups/         # Original Google Stitch HTML mockups (design reference)
│   ├── references/      # Project specification, final report, and reference documents
│   └── screenshots/     # Actual application screenshots
├── database/            # SQL scripts: schema creation, stored procedures, triggers, seed data
│   ├── CreateDB/        # Table creation scripts (34 tables)
│   ├── GenData/         # Mock data generation scripts
│   ├── SP_DKyThue/      # Stored procedures: Rental Registration
│   ├── SP_DatCoc/       # Stored procedures: Deposit
│   ├── SP_NhanPhong/    # Stored procedures: Check-in & Contract
│   ├── SP_TraPhong/     # Stored procedures: Checkout & Settlement
│   ├── SP_Admin/        # Stored procedures: Administration
│   ├── SP_Chung/        # Stored procedures: Shared (Auth, scheduled tasks)
│   └── Trigger/         # Database triggers
├── web/
│   ├── frontend/        # React SPA (Vite)
│   │   └── src/
│   │       ├── pages/           # Feature pages by module
│   │       ├── components/      # Reusable UI components
│   │       ├── api/             # API client layer
│   │       ├── auth/            # Authentication context & guards
│   │       ├── layouts/         # Page layout templates
│   │       └── styles/          # Global CSS stylesheets
│   ├── backend/         # Express.js API server
│   │   ├── routes/              # API route definitions
│   │   ├── controllers/         # Request handlers
│   │   ├── services/            # Business logic layer
│   │   ├── repositories/        # Data access layer
│   │   ├── middleware/          # Auth, file upload middleware
│   │   ├── database/           # Database connection pool
│   │   └── models/             # Data models
│   └── scripts/         # Build & deployment utility scripts
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** database (or a [Supabase](https://supabase.com) project)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/NhatVy177/HomeStayDorm.git
   cd HomeStayDorm
   ```

2. Install backend dependencies:
   ```bash
   cd web/backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Configure environment variables:
   ```bash
   # In web/backend/, create a .env file:
   DATABASE_URL=postgresql://user:password@host:port/database
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

5. Initialize the database:
   ```bash
   # Run the schema creation script (database/CreateDB/app.sql)
   # Then run seed data (database/GenData/data.sql)
   # Then deploy stored procedures:
   cd web/scripts
   node generate_complete_supabase_sql.cjs
   ```

6. Start the development servers:
   ```bash
   # Terminal 1 — Backend
   cd web/backend
   npm run dev

   # Terminal 2 — Frontend
   cd web/frontend
   npm run dev
   ```

7. Open `http://localhost:5173` in your browser.

---

## 📞 Contact

- **Team 10** — Faculty of Information Technology, University of Science, VNU-HCM
- **Project Leader:** Nguyễn Nhật Vy (23120192)
