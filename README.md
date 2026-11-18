# Laptop Inventory Management System (LIMS) — AI-Handoff Master Document

> **This file is the single source of truth.** Any AI that receives it must follow it exactly.
> **Owner's start command for a new chat:** *"Continue from the next unchecked task."*

---

## 📍 CURRENT HANDOFF STATUS

| Field | Value |
|---|---|
| **Last Completed Task** | **Step 11 — Reports (complete)**. Project is at 96/96 backend tests passing. All 12 steps implemented. |
| **Next Immediate Task** | **Step 12 — Final manual testing**. Confirm Admin + Staff walkthroughs, then deploy. |
| **Active Bugs / Notes** | No known bugs. Reports used CSV export instead of Recharts (simpler, no new dependency). |
| **Last Updated** | 18 Nov 2026 |

### How a new AI must start (do this in order)
1. Read this whole file. Sections 1 to 4 are locked rules; Section 5 is the live state.
2. Read the **Current Handoff Status** box above.
3. Build **only** the Next Immediate Task (and the rest of its step, in order). Nothing else.
4. Reply with: the list of files created or changed, the **full content of each file** under its full path, and short run/test instructions.
5. Do not mark any checkbox `[x]` yourself. Only the owner confirms completion, using "Generate Handoff Update" (Section 6).

---

# 🤖 SECTION 1 — STRICT AI RULES & GUARDRAILS

These are system instructions for every future chat, on any AI platform.

## 1.1 Absolute prohibitions (NEVER)
- **NEVER refactor, rename, reformat or "improve" existing code** unless the owner explicitly asks.
- **NEVER change, replace, add or remove libraries/packages** that are not listed in Section 3.2. If you think a new package is needed, **stop and ask the owner first**.
- **NEVER change the UI theme, colors, fonts, spacing or layout** defined in Section 2.
- **NEVER deviate from the folder/file tree** in Section 3.4. Do not create extra folders, rename files, or move files. If a needed file is missing from the tree, ask the owner.
- **NEVER change the database schema or API contracts** in Section 4 on your own. If a change is needed, propose it to the owner and wait for approval. After approval, update Section 4 and the Decisions Log (5.5).
- **NEVER skip validation or permission checks** to make something work faster.
- **NEVER invent behavior** for anything this document does not define. Ask one clear question instead.
- **NEVER change the build order** in Section 5.

## 1.2 Always (MUST)
- Follow the build steps in Section 5 in order, one step at a time.
- Enforce permissions **in the FastAPI backend**. Hiding a button in React is never enough (BR-05).
- Keep the backend routers thin; put business logic in `services/`.
- Reuse existing components from `components/common/` instead of writing new styling.
- Return complete files, not fragments, unless the owner asks for a small patch.
- Write the automated backend tests listed for the step (Section 5.2) together with the backend code.

## 1.3 Coding standards — Backend (Python)

| Topic | Rule |
|---|---|
| Naming | `snake_case` for variables, functions, files, modules, DB tables and columns. `PascalCase` for classes. `UPPER_SNAKE_CASE` for constants. Tables are **plural** (`products`). |
| Python | 3.11+, type hints on every function, f-strings. |
| SQLAlchemy | **2.0 syntax only**: `DeclarativeBase`, `Mapped[...]`, `mapped_column(...)`, `select(...)` with `session.execute(...)` / `session.scalars(...)`. **No** legacy `session.query(...)`. Synchronous engine and session (not async). |
| Pydantic | **v2 only**: `BaseModel`, `ConfigDict(from_attributes=True)`, `field_validator`, `model_validate`, `model_dump`. **No** `orm_mode`, `.dict()`, `@validator`. |
| FastAPI | One `APIRouter(prefix=..., tags=[...])` per module in `routers/`. Plain `def` endpoints (not `async def`). Dependencies via `Annotated[..., Depends(...)]`. Every endpoint declares `response_model` and an explicit `status_code`. |
| Errors | Raise `HTTPException(status_code=..., detail="message")`. Messages are plain, user-friendly English. |
| Money | `Decimal` everywhere in Python. Never `float`. |
| Imports | Absolute imports starting with `app.` (for example `from app.core.database import get_db`). |

## 1.4 Coding standards — Frontend (TypeScript / React)

| Topic | Rule |
|---|---|
| Language | TypeScript with `strict: true`. **No `any`.** |
| Components | Function components with hooks only. No class components. |
| Naming | `camelCase` for variables, functions, hooks (`useAuth`), props. `PascalCase` for components, interfaces, types. `UPPER_SNAKE_CASE` for constants. Handlers are named `handleXxx`. Booleans start with `is`/`has`/`can`. |
| File names | Components and pages: `PascalCase.tsx`. Everything else: `camelCase.ts`. |
| Exports | Components and pages: `export default`. Services, hooks, utils, types: named exports. |
| Props | Interface named `<Component>Props`. |
| API field names | Types that mirror API payloads **keep the API's `snake_case` keys exactly** (for example `full_name`, `min_stock_level`). Do not convert case. This is the one allowed exception to camelCase. |
| API calls | Only inside `services/`. Components never call `axios` directly. |
| Styling | Tailwind utility classes only. No inline `style`, no extra CSS files (only `index.css`). |
| Imports | Relative imports only. No path aliases. |
| Forms | `react-hook-form`. Show field errors under the input in red. |
| Notifications | `react-hot-toast` (success and error messages). |
| Money display | Always via `formatCurrency()` in `utils/formatters.ts`. |

## 1.5 Git and files
- `backend/.env` and `frontend/.env` are never committed. `.env.example` files are committed.
- Do not paste real secrets into any answer.

---

# 🎨 SECTION 2 — LOCKED UI/UX & DESIGN SYSTEM

All colors use the **default Tailwind CSS palette**. Use the Tailwind class names; the hex codes are listed so every AI picks the same shade. Do not add custom colors to `tailwind.config.ts`.

## 2.1 Theme
- **Light theme only.** No dark mode and no theme toggle in Version 1.0.
- Style: clean admin dashboard, rounded corners, soft shadows, plenty of white space.

## 2.2 Color tokens

| Purpose | Tailwind class | Hex |
|---|---|---|
| Primary | `blue-600` | `#2563EB` |
| Primary hover | `blue-700` | `#1D4ED8` |
| Primary light background | `blue-50` | `#EFF6FF` |
| Focus ring | `blue-500` | `#3B82F6` |
| Sidebar background | `blue-900` | `#1E3A8A` |
| Sidebar text | `blue-100` | `#DBEAFE` |
| Sidebar hover background | `blue-800` | `#1E40AF` |
| Sidebar active item | `bg-blue-600 text-white` | `#2563EB` / `#FFFFFF` |
| Page background | `slate-50` | `#F8FAFC` |
| Card / navbar / modal background | `white` | `#FFFFFF` |
| Border | `slate-200` | `#E2E8F0` |
| Input border | `slate-300` | `#CBD5E1` |
| Text primary | `slate-900` | `#0F172A` |
| Text secondary | `slate-600` | `#475569` |
| Text muted | `slate-400` | `#94A3B8` |
| Success | `green-600` (badge: `bg-green-100 text-green-700`) | `#16A34A` |
| Warning | `amber-600` (badge: `bg-amber-100 text-amber-700`) | `#D97706` |
| Danger | `red-600` (badge: `bg-red-100 text-red-700`) | `#DC2626` |
| Neutral badge | `bg-slate-100 text-slate-600` | `#F1F5F9` / `#475569` |

## 2.3 Typography
- Font: **Inter** via `@fontsource/inter` (weights 400, 500, 600, 700), imported in `main.tsx`. Fallback: `ui-sans-serif, system-ui, sans-serif`.
- Page title `h1`: `text-2xl font-semibold text-slate-900`.
- Section/card title: `text-lg font-semibold text-slate-900`.
- Body: `text-sm text-slate-700`. Table header: `text-xs font-medium uppercase tracking-wide text-slate-500`.

## 2.4 Layout
- **Sidebar:** fixed left, `w-64`, `bg-blue-900`, visible from `lg` (1024px) and up. Logo text "Laptop Store" at the top (`text-white text-xl font-semibold`, `h-16`). Menu items: `px-4 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-800`, active = `bg-blue-600 text-white`.
- **Below `lg`:** sidebar becomes an off-canvas drawer with a dark overlay (`bg-black/50`), opened by a hamburger button in the navbar.
- **Navbar:** `h-16 bg-white border-b border-slate-200`. Left: hamburger (mobile only) and page title. Right: user full name (clickable, goes to `/profile`), role badge, and a Logout button (`LogOut` icon).
- **Main content:** `bg-slate-50`, padding `p-4 md:p-6`, content width `max-w-7xl mx-auto`.
- **Page header:** `h1` on the left, primary action button on the right (stacks on mobile).
- **Card:** `bg-white rounded-xl border border-slate-200 shadow-sm p-6`.
- **Tables:** inside a card, wrapped in `overflow-x-auto`. Header row `bg-slate-50`. Rows `divide-y divide-slate-200`, hover `hover:bg-slate-50`. Cell padding `px-4 py-3`.

## 2.5 Components (custom, in `components/common/`; no external UI library)

| Component | Spec |
|---|---|
| `Button` | `rounded-lg px-4 py-2 text-sm font-medium`. Variants: `primary` (`bg-blue-600 text-white hover:bg-blue-700`), `secondary` (`bg-white border border-slate-300 text-slate-700 hover:bg-slate-50`), `danger` (`bg-red-600 text-white hover:bg-red-700`), `ghost` (`text-slate-600 hover:bg-slate-100`). Supports `isLoading` (spinner, disabled) and an optional icon. |
| `Input` / `Select` / `Textarea` | `h-10` (textarea `min-h-24`), `rounded-lg border border-slate-300 px-3 text-sm`, focus `ring-2 ring-blue-500 border-blue-500`. Label above (`text-sm font-medium text-slate-700`), error text below (`text-xs text-red-600`). |
| `Modal` | Overlay `bg-black/50`, panel `bg-white rounded-xl max-w-lg w-full p-6`, title, close `X` button. |
| `ConfirmDialog` | Uses `Modal`. Used before **every** delete or deactivate. Confirm button is `danger`. |
| `Table` | Generic typed table with columns, rows, loading state and empty state. |
| `Pagination` | Previous / Next buttons and "Page X of Y". |
| `Badge` | `rounded-full px-2.5 py-0.5 text-xs font-medium`, color variants `green`, `amber`, `red`, `blue`, `slate`. |
| `Card` | The card style above. |
| `Spinner` | `Loader2` icon with `animate-spin`, `text-blue-600`. |
| `EmptyState` | Centered icon, short message, optional action button. |
| `PageHeader` | Title + optional action slot. |
| `StatCard` (dashboard) | Card with icon in a `bg-blue-50 text-blue-600 rounded-lg p-2` box, label (`text-sm text-slate-600`), value (`text-2xl font-semibold`). |

## 2.6 Icons (Lucide React only)
Sidebar icons at `h-5 w-5`; button icons at `h-4 w-4`.

| Item | Icon | Item | Icon |
|---|---|---|---|
| Dashboard | `LayoutDashboard` | Reports | `BarChart3` |
| Products | `Laptop` | Staff Management | `Users` |
| Brands | `Tag` | Settings | `Settings` |
| Categories | `Layers` | My Profile | `User` |
| Stock In | `PackagePlus` | Logout | `LogOut` |
| Sales | `ShoppingCart` | Edit / Delete / Add | `Pencil` / `Trash2` / `Plus` |
| Stock History | `History` | Search | `Search` |
| Low Stock | `AlertTriangle` | Close | `X` |

## 2.7 Status badges (fixed)

| Meaning | Badge |
|---|---|
| In Stock | green |
| Low Stock | amber |
| Out of Stock | red |
| Active | green |
| Inactive | slate |
| Role Admin | blue |
| Role Staff | slate |
| History type "Stock In" | green |
| History type "Sale" | blue |

Stock status rule for a product: `quantity == 0` → Out of Stock; `quantity < min_stock_level` → Low Stock; otherwise In Stock.

## 2.8 Required UI behaviors (every page)
- Show `Spinner` while loading. Show `EmptyState` when there is no data.
- Confirm before delete/deactivate with `ConfirmDialog`.
- Success and error messages through `react-hot-toast` (position `top-right`).
- Show the backend's `detail` message to the user for errors.
- Dates in forms default to today and cannot be in the future. Display dates as `DD MMM YYYY` (for example `12 Nov 2026`).
- Money display: `Rs. 115,000` (no decimals if `.00`).
- Tables scroll horizontally on small screens. Forms are one column on mobile, two columns from `md`.

## 2.9 Page blueprints

| Page | Route | Access | Contents |
|---|---|---|---|
| Login | `/login` | Public | Centered white card on `slate-50`: email, password, Login button, error message. No signup link. |
| Dashboard | `/dashboard` | Both | "Welcome back, {full_name}!", 5 `StatCard`s (Total Products, Total Available Stock, Low Stock Products, Stock-In Records, Stock-Out Records), Recent Stock Activities, Low Stock Products, Recent Sales. |
| Products | `/products` | Both (Staff view-only) | Search box, Brand filter, Category filter, table with status badge, View details (modal). Admin also sees Add Product, Edit, Delete, Deactivate/Activate. Admin has an "Show inactive" checkbox. |
| Product Form | `/products/new`, `/products/:id/edit` | Admin | Fields: name, brand, category, model, processor, RAM, storage, purchase price, selling price, minimum stock level, description. **No quantity field.** Edit page also has an Active toggle. |
| Brands | `/brands` | Admin | Table + Add/Edit in `Modal` (one field: name) + Delete with confirm. |
| Categories | `/categories` | Admin | Same as Brands. |
| Stock In | `/stock-in` | Both | Select laptop (active products), current quantity (read-only), quantity received, purchase price per unit (optional), date, notes (optional), Submit. Recent stock-in table below. |
| Sales | `/sales` | Both | Select laptop (active products), available quantity (read-only), quantity sold, selling price per unit (prefilled from product, editable), auto total (read-only), sale date, Submit. Recent sales table below. |
| Stock History | `/history` | Both | Filters: laptop, type (All / Stock In / Sale), date from, date to. Table: date, type badge, laptop, quantity, unit price, total, performed by. No edit/delete. |
| Low Stock | `/low-stock` | Both | Table: laptop, brand, model, available, minimum, status badge. |
| Reports | `/reports` | Admin | Tabs: Current Stock, Low Stock, Stock-In, Sales. Date filters on Stock-In and Sales tabs. Total sales card. One simple Recharts bar chart (sales amount per day) on the Sales tab. |
| Staff Management | `/staff` | Admin | Staff table, Add Staff (modal: full name, email, password), Edit (full name, email), Activate/Deactivate. |
| My Profile | `/profile` | Both | Read-only card: full name, email, role, status, member since. |
| Settings | `/settings` | Admin | Placeholder card: "Settings will be available in a future version." (see 5.4) |
| Not Found | `*` | Any | Simple 404 message with link to `/dashboard`. |

**Sidebar order**
- **Admin:** Dashboard, Products, Brands, Categories, Stock In, Sales, Stock History, Low Stock, Reports, Staff Management, Settings.
- **Staff:** Dashboard, Products, Stock In, Sales, Stock History, Low Stock, My Profile.
- `/` redirects to `/dashboard`. A logged-out user is redirected to `/login`. A user opening a page they are not allowed to see is redirected to `/dashboard` with the toast "You do not have permission to open that page."

---

# 🏗️ SECTION 3 — LOCKED ARCHITECTURE, TECH STACK & FOLDER TREE

## 3.1 Product scope, roles and business rules

**Project:** Laptop Store inventory and stock system, Version 1.0. Inventory is **quantity-based** (one total count per laptop model). Sales are **basic** (one product per sale). Currency is Rs. (PKR). No public signup.

**Roles**

| Page / Action | Admin | Staff |
|---|---|---|
| Login / Logout, Dashboard, Stock In, Sales, Stock History, Low Stock, My Profile | Yes | Yes |
| Products | Add, edit, delete, deactivate | View, search, filter only |
| Brands, Categories | Manage | No page. Can read the lists (for filters and forms). |
| Reports, Staff Management, Settings | Yes | No |

**Business rules**

| ID | Rule |
|---|---|
| BR-01 | Stock can never be negative. |
| BR-02 | Stock-in increases quantity; a sale decreases it. Automatic. |
| BR-03 | Every stock-in and sale creates a permanent history record (who, when, how many). |
| BR-04 | Product data must be valid (see field limits in Section 4.3). |
| BR-05 | Role permissions are enforced in FastAPI. |
| BR-06 | Deleting a product must not destroy history. A product with any stock-in or sale cannot be deleted; Admin **deactivates** it. A product with no history can be deleted. |
| BR-07 | `products.quantity` is changed **only** by stock-in and sales, never by the product form or product API. |
| BR-08 | Low stock means `quantity < min_stock_level`, active products only. |
| BR-09 | Brands, categories and users in use are not deleted (brand/category: blocked; users: deactivated). |
| BR-10 | History records have no edit or delete, in the API or UI. |
| BR-11 | Past sales keep their saved unit price and total even if the product price changes later. |
| BR-12 | Deactivated products are hidden from the Staff product list, from Stock In and from Sales. History keeps them. |
| BR-13 | Stock-in and sale dates cannot be in the future. |

**Non-functional requirements:** hashed passwords (NFR-01), role authorization (02), fast responses (03), accurate stock (04), data integrity (05), simple usability (06), responsive desktop/tablet/mobile (07), modular maintainable code (08), room for future features (09), understandable errors (10).

**Version 2.0 (do NOT build now):** serial numbers/warranty, suppliers, customers, invoice PDFs, barcode scanning, advanced analytics/accounting, multiple branches, dark mode, password reset flows, token blacklisting.

## 3.2 Tech stack (locked)

| Layer | Tool | Lock |
|---|---|---|
| Language (backend) | Python | 3.11 or newer |
| API framework | FastAPI | Latest stable at Step 1, then pinned |
| Server | Uvicorn | Pinned at Step 1 |
| ORM | SQLAlchemy | **2.0.x**, sync |
| DB driver | psycopg (v3) `psycopg[binary]` | Pinned at Step 1 |
| Database | PostgreSQL | 14 or newer |
| Validation | Pydantic | **2.x** (with `email-validator`) |
| Settings | `pydantic-settings` | Pinned at Step 1 |
| JWT | `PyJWT`, algorithm HS256 | Pinned at Step 1 |
| Password hashing | `bcrypt` | Pinned at Step 1 |
| Backend tests | `pytest`, `httpx` (FastAPI TestClient) | Pinned at Step 1 |
| Frontend language | TypeScript | 5.x, strict |
| UI library | React | **18.x** (not 19) |
| Build tool | Vite | Latest stable at Step 3, then pinned |
| Routing | `react-router-dom` | **6.x** |
| Styling | Tailwind CSS | **3.4.x** (with PostCSS and Autoprefixer) |
| Icons | `lucide-react` | Pinned at Step 3 |
| HTTP client | `axios` | Pinned at Step 3 |
| Forms | `react-hook-form` | Pinned at Step 3 |
| Toasts | `react-hot-toast` | Pinned at Step 3 |
| Charts | `recharts` (Reports page only) | Pinned at Step 11 |
| Font | `@fontsource/inter` | Pinned at Step 3 |

**Auth design**
- Login returns a JWT (HS256). Payload: `sub` (user id as string), `role`, `exp`. Expiry: `ACCESS_TOKEN_EXPIRE_MINUTES` (default 60).
- Frontend stores the token in `localStorage` under key `lims_token` and sends `Authorization: Bearer <token>`.
- Logout = delete the token and clear `AuthContext`. On any `401` response, the frontend clears the token and redirects to `/login`.
- Passwords: 8 to 72 characters, hashed with bcrypt. Emails are stored lowercase.
- CORS allows only `http://localhost:5173` in development (configurable via `.env`).
- Tables are created at startup with `Base.metadata.create_all` (no Alembic in V1.0).
- **First Admin:** at startup, if no user with role `admin` exists, create one from `ADMIN_EMAIL` and `ADMIN_PASSWORD` (full name `Admin`).

**Stock transaction algorithm (must be followed exactly)**
1. Open one DB transaction.
2. Load the product with a row lock: `select(Product).where(Product.id == product_id).with_for_update()`.
3. Not found → 404 `Product not found.` Inactive → 400 `This product is deactivated.`
4. **Stock-in:** insert `stock_ins` row, then `product.quantity += quantity`.
5. **Sale:** if `product.quantity < quantity` → 400 `Only {n} unit(s) available.` Else compute `total_amount = (quantity * selling_price)` rounded to 2 decimals, insert `sales` row, then `product.quantity -= quantity`.
6. Commit. If anything fails, roll back and save nothing.

## 3.3 Environment files

`backend/.env`
```env
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/laptop_store
SECRET_KEY=<long random text>
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<first admin password>
```

`frontend/.env`
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Run commands: backend `uvicorn app.main:app --reload` (from `backend/`), frontend `npm run dev` (from `frontend/`, default port 5173), tests `pytest` (from `backend/`).

## 3.4 Locked folder tree

### Root
```
laptop-store/
├── backend/        # FastAPI application
├── frontend/       # React + TypeScript application
├── .gitignore      # ignores .env, node_modules, __pycache__, venv, dist
└── README.md       # this file (single source of truth)
```

### /backend
```
backend/
├── .env.example                    # template of required environment variables
├── requirements.txt                # pinned Python packages
├── pytest.ini                      # pytest configuration (test path)
├── app/
│   ├── __init__.py                 # marks package
│   ├── main.py                     # creates FastAPI app, CORS, startup (create tables + first Admin), registers routers, /api/health
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py               # Settings class reading .env (pydantic-settings)
│   │   ├── database.py             # engine, SessionLocal, Base (DeclarativeBase), get_db dependency
│   │   ├── security.py             # hash_password, verify_password, create_access_token, decode_access_token
│   │   └── init_db.py              # create_all tables and create the first Admin if none exists
│   ├── models/
│   │   ├── __init__.py             # imports all models so create_all sees them
│   │   ├── user.py                 # User model and UserRole enum
│   │   ├── brand.py                # Brand model
│   │   ├── category.py             # Category model
│   │   ├── product.py              # Product model
│   │   ├── stock_in.py             # StockIn model
│   │   └── sale.py                 # Sale model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py               # generic ListResponse and shared types
│   │   ├── auth.py                 # LoginRequest, LoginResponse
│   │   ├── user.py                 # UserCreate, UserUpdate, UserOut
│   │   ├── brand.py                # BrandCreate, BrandUpdate, BrandOut
│   │   ├── category.py             # CategoryCreate, CategoryUpdate, CategoryOut
│   │   ├── product.py              # ProductCreate, ProductUpdate, ProductOut
│   │   ├── stock_in.py             # StockInCreate, StockInOut
│   │   ├── sale.py                 # SaleCreate, SaleOut
│   │   ├── history.py              # HistoryItem, LowStockItem
│   │   ├── dashboard.py            # DashboardSummary
│   │   └── report.py               # report response schemas
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py                 # POST /auth/login, GET /auth/me
│   │   ├── users.py                # Staff account endpoints (Admin)
│   │   ├── brands.py               # brand endpoints
│   │   ├── categories.py           # category endpoints
│   │   ├── products.py             # product endpoints
│   │   ├── stock_in.py             # stock-in endpoints
│   │   ├── sales.py                # sales endpoints
│   │   ├── history.py              # GET /history
│   │   ├── low_stock.py            # GET /low-stock
│   │   ├── dashboard.py            # GET /dashboard/summary
│   │   └── reports.py              # report endpoints (Admin)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py         # user create/list/update rules
│   │   ├── brand_service.py        # brand rules (duplicate, in-use delete block)
│   │   ├── category_service.py     # category rules
│   │   ├── product_service.py      # product rules (search, filters, delete vs deactivate)
│   │   ├── stock_service.py        # stock-in and sale transactions (row lock, quantity update)
│   │   ├── history_service.py      # merged history query and low-stock query
│   │   ├── dashboard_service.py    # dashboard summary calculations
│   │   └── report_service.py       # report queries and totals
│   ├── dependencies/
│   │   ├── __init__.py
│   │   └── auth.py                 # get_current_user, require_admin
│   └── utils/
│       ├── __init__.py
│       └── pagination.py           # page / page_size helpers
└── tests/
    ├── conftest.py                 # test database, client, Admin/Staff fixtures, sample data
    ├── test_auth.py                # login, token, 401/403 checks
    ├── test_users.py               # Staff management rules
    ├── test_brands_categories.py   # duplicates, in-use delete block
    ├── test_products.py            # validation, quantity rejected, delete vs deactivate, search
    ├── test_stock_in.py            # quantity increase, validation, history record
    ├── test_sales.py               # totals, overselling block, concurrency, price snapshot
    ├── test_history_low_stock.py   # filters, low-stock boundary
    └── test_dashboard_reports.py   # dashboard numbers, report totals, Staff blocked
```

### /frontend
```
frontend/
├── .env.example                    # VITE_API_BASE_URL template
├── index.html                      # Vite HTML entry
├── package.json                    # pinned dependencies and scripts
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript config (strict) plus Vite template tsconfig files
├── tailwind.config.ts              # Tailwind content paths (no custom colors)
├── postcss.config.js               # Tailwind and Autoprefixer
└── src/
    ├── main.tsx                    # React entry; imports font and index.css
    ├── App.tsx                     # AuthProvider, Router, Toaster
    ├── index.css                   # Tailwind directives and base body styles
    ├── vite-env.d.ts               # Vite types
    ├── types/
    │   ├── common.ts               # ListResponse<T>, ApiError
    │   ├── user.ts                 # User, UserCreate, UserUpdate, LoginResponse
    │   ├── catalog.ts              # Brand, Category
    │   ├── product.ts              # Product, ProductPayload
    │   ├── stock.ts                # StockIn, Sale, HistoryItem, LowStockItem
    │   ├── dashboard.ts            # DashboardSummary
    │   └── report.ts               # report response types
    ├── services/
    │   ├── api.ts                  # axios instance, token header, 401 handling
    │   ├── authService.ts          # login, getMe
    │   ├── userService.ts          # Staff API calls
    │   ├── brandService.ts         # brand API calls
    │   ├── categoryService.ts      # category API calls
    │   ├── productService.ts       # product API calls
    │   ├── stockService.ts         # stock-in and sales API calls
    │   ├── historyService.ts       # history and low-stock API calls
    │   ├── dashboardService.ts     # dashboard summary call
    │   └── reportService.ts        # report API calls
    ├── context/
    │   └── AuthContext.tsx         # user, token, login, logout, isAdmin
    ├── hooks/
    │   ├── useAuth.ts              # access AuthContext
    │   └── useDebounce.ts          # debounce search input
    ├── utils/
    │   ├── constants.ts            # roles, route paths, storage key
    │   ├── formatters.ts           # formatCurrency, formatDate, today()
    │   └── errors.ts               # getErrorMessage(error) from API errors
    ├── routes/
    │   ├── AppRoutes.tsx           # all routes
    │   └── ProtectedRoute.tsx      # login and role guard (allowedRoles prop)
    ├── components/
    │   ├── common/
    │   │   ├── Button.tsx          # button with variants and loading
    │   │   ├── Input.tsx           # labeled text input with error
    │   │   ├── Select.tsx          # labeled select with error
    │   │   ├── Textarea.tsx        # labeled textarea with error
    │   │   ├── Modal.tsx           # modal dialog
    │   │   ├── ConfirmDialog.tsx   # delete/deactivate confirmation
    │   │   ├── Table.tsx           # generic table with loading/empty states
    │   │   ├── Pagination.tsx      # previous/next pagination
    │   │   ├── Badge.tsx           # colored status badge
    │   │   ├── Card.tsx            # white card container
    │   │   ├── Spinner.tsx         # loading spinner
    │   │   ├── EmptyState.tsx      # empty list message
    │   │   └── PageHeader.tsx      # page title and action slot
    │   ├── layout/
    │   │   ├── Sidebar.tsx         # role-based menu, mobile drawer
    │   │   ├── Navbar.tsx          # title, user info, logout, hamburger
    │   │   └── MainLayout.tsx      # sidebar + navbar + outlet
    │   ├── dashboard/
    │   │   └── StatCard.tsx        # dashboard summary card
    │   └── products/
    │       └── ProductDetailsModal.tsx  # read-only product details modal
    └── pages/
        ├── Login.tsx               # login form
        ├── Dashboard.tsx           # summary cards and recent lists
        ├── Products.tsx            # product list, search, filters, actions
        ├── ProductForm.tsx         # add/edit product form
        ├── Brands.tsx              # brand management
        ├── Categories.tsx          # category management
        ├── StockIn.tsx             # stock-in form and recent list
        ├── Sales.tsx               # sale form and recent list
        ├── History.tsx             # stock and sales history
        ├── LowStock.tsx            # low-stock list
        ├── Reports.tsx             # reports with tabs and chart
        ├── StaffManagement.tsx     # Staff accounts (Admin)
        ├── Profile.tsx             # own details
        ├── Settings.tsx            # placeholder
        └── NotFound.tsx            # 404 page
```

---

# 🗄️ SECTION 4 — EXACT DATABASE SCHEMA & API CONTRACTS

## 4.1 PostgreSQL schema

SQLAlchemy models must match this exactly (names, types, constraints). Identity columns are `Integer` primary keys with autoincrement. Timestamps use `DateTime(timezone=True)` with `server_default=func.now()`. `products.updated_at` also has `onupdate=func.now()`.

```sql
CREATE TYPE user_role AS ENUM ('admin', 'staff');

CREATE TABLE users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role    NOT NULL DEFAULT 'staff',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE brands (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_brands_name_lower ON brands (lower(name));

CREATE TABLE categories (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_categories_name_lower ON categories (lower(name));

CREATE TABLE products (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            VARCHAR(150)  NOT NULL,
  brand_id        INTEGER       NOT NULL REFERENCES brands(id)     ON DELETE RESTRICT,
  category_id     INTEGER       NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  model           VARCHAR(100)  NOT NULL,
  processor       VARCHAR(100)  NOT NULL,
  ram             VARCHAR(50)   NOT NULL,
  storage         VARCHAR(50)   NOT NULL,
  purchase_price  NUMERIC(12,2) NOT NULL,
  selling_price   NUMERIC(12,2) NOT NULL,
  quantity        INTEGER       NOT NULL DEFAULT 0,
  min_stock_level INTEGER       NOT NULL DEFAULT 0,
  description     TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT ck_products_quantity       CHECK (quantity >= 0),
  CONSTRAINT ck_products_min_stock      CHECK (min_stock_level >= 0),
  CONSTRAINT ck_products_purchase_price CHECK (purchase_price >= 0),
  CONSTRAINT ck_products_selling_price  CHECK (selling_price >= 0)
);
CREATE INDEX ix_products_name        ON products (name);
CREATE INDEX ix_products_model       ON products (model);
CREATE INDEX ix_products_brand_id    ON products (brand_id);
CREATE INDEX ix_products_category_id ON products (category_id);

CREATE TABLE stock_ins (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id     INTEGER       NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity       INTEGER       NOT NULL,
  purchase_price NUMERIC(12,2),
  stock_date     DATE          NOT NULL,
  notes          TEXT,
  created_by     INTEGER       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT ck_stock_ins_quantity CHECK (quantity > 0),
  CONSTRAINT ck_stock_ins_price    CHECK (purchase_price IS NULL OR purchase_price >= 0)
);
CREATE INDEX ix_stock_ins_product_id ON stock_ins (product_id);
CREATE INDEX ix_stock_ins_stock_date ON stock_ins (stock_date);

CREATE TABLE sales (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id    INTEGER       NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity      INTEGER       NOT NULL,
  selling_price NUMERIC(12,2) NOT NULL,
  total_amount  NUMERIC(12,2) NOT NULL,
  sale_date     DATE          NOT NULL,
  created_by    INTEGER       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT ck_sales_quantity      CHECK (quantity > 0),
  CONSTRAINT ck_sales_price         CHECK (selling_price >= 0),
  CONSTRAINT ck_sales_total         CHECK (total_amount = quantity * selling_price)
);
CREATE INDEX ix_sales_product_id ON sales (product_id);
CREATE INDEX ix_sales_sale_date  ON sales (sale_date);
```

There is **no history table**. `/history` merges `stock_ins` and `sales`.

## 4.2 Global API conventions

| Topic | Rule |
|---|---|
| Base path | `/api` |
| Auth | Header `Authorization: Bearer <token>` on every endpoint except `POST /auth/login` and `GET /health` |
| JSON keys | `snake_case` |
| Dates | `YYYY-MM-DD`. Timestamps: ISO 8601 (for example `2026-11-12T10:30:00Z`). |
| Money | **Requests:** JSON numbers (max 2 decimals). **Responses:** JSON strings with 2 decimals (for example `"115000.00"`). Frontend types use `string`. |
| List responses | `{ "items": [...], "total": 42 }`. Paginated lists also include `"page"` and `"page_size"`. |
| Pagination | Query `page` (default 1) and `page_size` (default 20, max 100). Used on: `/users`, `/products`, `/stock-in`, `/sales`, `/history`. Brands, categories, low-stock and reports are **not** paginated. |
| Sorting | Newest first for stock-in, sales, history (by date desc, then `created_at` desc). Brands, categories, products and users sorted by name (users by `created_at` desc). |
| Delete success | `204 No Content` |
| Create success | `201 Created` with the created object |

**Error format**

| Status | Meaning | Body |
|---|---|---|
| 400 | Business rule broken (not enough stock, inactive product, bad date range, deactivating yourself) | `{ "detail": "message" }` |
| 401 | Missing or invalid token, or wrong login | `{ "detail": "message" }` |
| 403 | Not allowed (Staff on Admin route, deactivated account) | `{ "detail": "message" }` |
| 404 | Not found | `{ "detail": "message" }` |
| 409 | Duplicate or in use | `{ "detail": "message" }` |
| 422 | Validation error (FastAPI default) | `{ "detail": [ { "loc": [...], "msg": "...", "type": "..." } ] }` |

The frontend's `getErrorMessage()` returns `detail` if it is a string, or joins the `msg` values if it is a list.

## 4.3 Validation limits

| Field | Rule |
|---|---|
| `full_name` | 1–100 chars |
| `email` | valid email, max 255, stored lowercase |
| `password` | 8–72 chars |
| brand / category `name` | 1–100 chars, trimmed, unique ignoring case |
| product `name` | 1–150 chars |
| `model`, `processor` | 1–100 chars |
| `ram`, `storage` | 1–50 chars |
| `purchase_price`, `selling_price` | number ≥ 0, max 2 decimals, max 9,999,999,999.99 |
| `min_stock_level` | integer ≥ 0 |
| `description` | optional, max 1000 chars |
| stock-in / sale `quantity` | integer 1–100000 |
| `notes` | optional, max 500 chars |
| `stock_date`, `sale_date` | valid date, not in the future |
| Product create/update bodies | `extra="forbid"`: sending `quantity` returns 422 |

## 4.4 Shared response objects

**UserOut**
```json
{ "id": 2, "full_name": "Ali Khan", "email": "ali@example.com", "role": "staff", "is_active": true, "created_at": "2026-11-12T10:30:00Z" }
```

**BrandOut / CategoryOut**
```json
{ "id": 1, "name": "Dell", "created_at": "2026-11-12T10:30:00Z" }
```

**ProductOut**
```json
{
  "id": 5, "name": "Dell Latitude 5420",
  "brand_id": 1, "brand_name": "Dell",
  "category_id": 2, "category_name": "Business Laptops",
  "model": "Latitude 5420", "processor": "Core i5 11th Gen", "ram": "8GB", "storage": "256GB SSD",
  "purchase_price": "100000.00", "selling_price": "115000.00",
  "quantity": 5, "min_stock_level": 2,
  "description": null, "is_active": true, "is_low_stock": false,
  "created_at": "2026-11-12T10:30:00Z", "updated_at": "2026-11-12T10:30:00Z"
}
```
`is_low_stock` = `quantity < min_stock_level`.

**StockInOut**
```json
{
  "id": 9, "product_id": 5, "product_name": "Dell Latitude 5420",
  "quantity": 3, "purchase_price": "100000.00", "stock_date": "2026-11-12", "notes": null,
  "created_by": 1, "created_by_name": "Admin", "created_at": "2026-11-12T10:30:00Z",
  "new_quantity": 8
}
```
`new_quantity` is present only in the response to `POST /stock-in`; it is `null` in list responses.

**SaleOut**
```json
{
  "id": 4, "product_id": 5, "product_name": "Dell Latitude 5420",
  "quantity": 2, "selling_price": "115000.00", "total_amount": "230000.00", "sale_date": "2026-11-12",
  "created_by": 2, "created_by_name": "Ali Khan", "created_at": "2026-11-12T11:00:00Z",
  "remaining_quantity": 6
}
```
`remaining_quantity` is present only in the response to `POST /sales`; it is `null` in list responses.

**HistoryItem**
```json
{
  "type": "sale", "record_id": 4,
  "product_id": 5, "product_name": "Dell Latitude 5420",
  "quantity": 2, "unit_price": "115000.00", "total_amount": "230000.00",
  "date": "2026-11-12", "notes": null,
  "performed_by": 2, "performed_by_name": "Ali Khan", "created_at": "2026-11-12T11:00:00Z"
}
```
`type` is `"stock_in"` or `"sale"`. For `stock_in`: `unit_price` is the purchase price (may be `null`) and `total_amount` is `null`. Frontend list key: `` `${type}-${record_id}` ``.

**LowStockItem**
```json
{ "id": 5, "name": "Dell Latitude 5420", "brand_name": "Dell", "model": "Latitude 5420", "quantity": 1, "min_stock_level": 3, "status": "low_stock" }
```
`status` is `"out_of_stock"` when `quantity == 0`, otherwise `"low_stock"`.

## 4.5 Endpoints

Access: **A** = Admin only, **A+S** = Admin and Staff, **P** = Public.

### Health and auth

| Method | Path | Access | Request | Success | Errors |
|---|---|---|---|---|---|
| GET | `/health` | P | none | 200 `{ "status": "ok" }` | none |
| POST | `/auth/login` | P | `{ "email": "a@b.com", "password": "..." }` | 200 `{ "access_token": "...", "token_type": "bearer", "user": UserOut }` | 401 `Invalid email or password.` · 403 `This account is deactivated.` |
| GET | `/auth/me` | A+S | none | 200 `UserOut` | 401 |

### Users (Admin)

| Method | Path | Access | Request | Success | Errors |
|---|---|---|---|---|---|
| POST | `/users` | A | `{ "full_name", "email", "password" }` (role is always `staff`) | 201 `UserOut` | 409 `Email already exists.` |
| GET | `/users?page=&page_size=&search=` | A | `search` matches name or email | 200 `{ items: UserOut[], total, page, page_size }` | 403 |
| GET | `/users/{id}` | A | none | 200 `UserOut` | 404 `User not found.` |
| PUT | `/users/{id}` | A | any of `{ "full_name", "email", "is_active" }` | 200 `UserOut` | 400 `You cannot deactivate your own account.` · 409 `Email already exists.` · 404 |

### Brands and categories (same contract; replace `brands` with `categories` and "brand" with "category")

| Method | Path | Access | Request | Success | Errors |
|---|---|---|---|---|---|
| GET | `/brands` | A+S | none | 200 `{ items: BrandOut[], total }` | none |
| POST | `/brands` | A | `{ "name": "Dell" }` | 201 `BrandOut` | 409 `Brand name already exists.` |
| PUT | `/brands/{id}` | A | `{ "name": "Dell" }` | 200 `BrandOut` | 404 · 409 `Brand name already exists.` |
| DELETE | `/brands/{id}` | A | none | 204 | 404 · 409 `Cannot delete brand: it is used by {n} product(s).` |

Category messages: `Category name already exists.` and `Cannot delete category: it is used by {n} product(s).`

### Products

| Method | Path | Access | Request | Success | Errors |
|---|---|---|---|---|---|
| GET | `/products?search=&brand_id=&category_id=&include_inactive=&page=&page_size=` | A+S | `search` matches `name` or `model` (case-insensitive contains). `include_inactive=true` works for Admin only; for Staff it is ignored and inactive products are never returned. | 200 `{ items: ProductOut[], total, page, page_size }` | none |
| GET | `/products/{id}` | A+S | none | 200 `ProductOut` | 404 `Product not found.` (also for Staff on inactive products) |
| POST | `/products` | A | `{ "name", "brand_id", "category_id", "model", "processor", "ram", "storage", "purchase_price", "selling_price", "min_stock_level", "description"? }` | 201 `ProductOut` (quantity starts at 0) | 404 `Brand not found.` / `Category not found.` · 422 |
| PUT | `/products/{id}` | A | any of the POST fields plus `"is_active"` | 200 `ProductOut` | 404 · 422 |
| DELETE | `/products/{id}` | A | none | 204 | 404 · 409 `This product has stock history and cannot be deleted. Deactivate it instead.` |

### Stock-in and sales

| Method | Path | Access | Request | Success | Errors |
|---|---|---|---|---|---|
| POST | `/stock-in` | A+S | `{ "product_id": 5, "quantity": 3, "purchase_price": 100000, "stock_date": "2026-11-12", "notes": "..." }` (`purchase_price` and `notes` optional) | 201 `StockInOut` | 404 `Product not found.` · 400 `This product is deactivated.` · 422 |
| GET | `/stock-in?product_id=&date_from=&date_to=&page=&page_size=` | A+S | none | 200 `{ items: StockInOut[], total, page, page_size }` | none |
| POST | `/sales` | A+S | `{ "product_id": 5, "quantity": 2, "selling_price": 115000, "sale_date": "2026-11-12" }` | 201 `SaleOut` | 404 · 400 `This product is deactivated.` · 400 `Only {n} unit(s) available.` · 422 |
| GET | `/sales?product_id=&date_from=&date_to=&page=&page_size=` | A+S | none | 200 `{ items: SaleOut[], total, page, page_size }` | none |

`created_by` always comes from the token, never from the request body. There is no PUT or DELETE for stock-in or sales.

### History, low stock, dashboard

| Method | Path | Access | Request | Success | Errors |
|---|---|---|---|---|---|
| GET | `/history?product_id=&type=&date_from=&date_to=&page=&page_size=` | A+S | `type` is `stock_in` or `sale`; omitted = both | 200 `{ items: HistoryItem[], total, page, page_size }` | 422 for invalid `type` |
| GET | `/low-stock` | A+S | none | 200 `{ items: LowStockItem[], total }` | none |
| GET | `/dashboard/summary` | A+S | none | 200 (below) | none |

**Dashboard response**
```json
{
  "cards": {
    "total_products": 12,
    "total_available_stock": 48,
    "low_stock_products": 3,
    "stock_in_records": 20,
    "stock_out_records": 15
  },
  "recent_activities": [ "HistoryItem x 10 (newest first)" ],
  "low_stock_products": [ "LowStockItem x 5" ],
  "recent_sales": [ "SaleOut x 5 (newest first)" ]
}
```
`total_products` and `total_available_stock` count **active** products only. `stock_in_records` = number of `stock_ins` rows; `stock_out_records` = number of `sales` rows.

### Reports (Admin only)

`date_from` and `date_to` are **required** on the three date-based reports. If `date_from > date_to` → 400 `Start date must be before end date.` Dates are inclusive.

| Method | Path | Success |
|---|---|---|
| GET | `/reports/current-stock` | `{ "generated_at": "...", "items": [ { "product_id", "name", "brand_name", "category_name", "model", "quantity", "min_stock_level", "purchase_price", "selling_price" } ], "total_products": 12, "total_units": 48 }` (active products) |
| GET | `/reports/low-stock` | `{ items: LowStockItem[], total }` |
| GET | `/reports/stock-in?date_from=&date_to=` | `{ "date_from", "date_to", "items": StockInOut[], "total_records": 5, "total_units": 20 }` |
| GET | `/reports/sales?date_from=&date_to=` | `{ "date_from", "date_to", "items": SaleOut[], "total_records": 8, "total_units": 11, "total_sales_amount": "1265000.00" }` |
| GET | `/reports/sales-total?date_from=&date_to=` | `{ "date_from", "date_to", "total_sales_amount": "1265000.00", "total_sales_count": 8, "total_units_sold": 11 }` |

---

# 📍 SECTION 5 — LIVE PROGRESS TRACKER & CURRENT STATE

> This is the only section that changes during development. Legend: `[x]` completed and confirmed by the owner · `[ ]` pending.
> The **Current Handoff Status** box is at the very top of this file.

## 5.1 Overall progress

| Step | Module | Status |
|---|---|---|
| 1 | Backend skeleton and database | [x] |
| 2 | Authentication and roles (backend) | [x] |
| 3 | React setup, layout, Login, protected routes | [x] |
| 4 | Staff Management, My Profile, Settings placeholder | [x] |
| 5 | Brands and Categories | [x] |
| 6 | Products | [x] |
| 7 | Stock In | [x] |
| 8 | Sales | [x] |
| 9 | History and Low Stock | [ ] |
| 10 | Dashboard | [ ] |
| 11 | Reports | [ ] |
| 12 | Final testing and cleanup | [ ] |

## 5.2 Granular checklist

### Step 1 — Backend skeleton and database
**Check:** server starts, tables exist, first Admin exists. ✅ VERIFIED
- [x] `backend/requirements.txt`
- [x] `backend/.env.example`
- [x] `backend/pytest.ini`
- [x] `.gitignore` (root)
- [x] `backend/app/__init__.py` and all other `__init__.py` files in the tree
- [x] `backend/app/core/config.py`
- [x] `backend/app/core/database.py`
- [x] `backend/app/core/security.py`
- [x] `backend/app/models/user.py`
- [x] `backend/app/models/brand.py`
- [x] `backend/app/models/category.py`
- [x] `backend/app/models/product.py`
- [x] `backend/app/models/stock_in.py`
- [x] `backend/app/models/sale.py`
- [x] `backend/app/models/__init__.py`
- [x] `backend/app/core/init_db.py` (create tables and first Admin)
- [x] `backend/app/main.py` (CORS, startup, `GET /api/health`)
- [x] Endpoint `GET /api/health`

### Step 2 — Authentication and roles (backend)
**Check:** login works; Staff gets 403 on Admin routes; no token gets 401. ✅ VERIFIED (24/24 tests pass)
- [x] `backend/app/schemas/common.py`
- [x] `backend/app/schemas/auth.py`
- [x] `backend/app/schemas/user.py` (`UserOut`, `UserCreate`, `UserUpdate`)
- [x] `backend/app/dependencies/auth.py` (`get_current_user`, `require_admin`)
- [x] `backend/app/routers/auth.py`
- [x] `backend/app/routers/users.py` (added manually — AI zip was missing)
- [x] `backend/app/services/user_service.py` (added manually)
- [x] Endpoint `POST /api/auth/login`
- [x] Endpoint `GET /api/auth/me`
- [x] Endpoint `POST /api/users`
- [x] Endpoint `GET /api/users`
- [x] Endpoint `GET /api/users/{id}`
- [x] Endpoint `PUT /api/users/{id}`
- [x] `backend/tests/conftest.py`
- [x] `backend/tests/test_auth.py`
- [x] `backend/tests/test_users.py`

### Step 3 — React setup, layout, Login, protected routes
**Check:** log in as Admin and see the dashboard shell with the correct sidebar.
- [x] Vite + React + TypeScript project created in `frontend/`; packages installed (record versions in 5.3)
- [x] `frontend/.env.example`, `tailwind.config.ts`, `postcss.config.js`, `src/index.css`
- [x] `src/main.tsx`, `src/App.tsx`
- [x] `src/types/common.ts`, `src/types/user.ts`
- [x] `src/utils/constants.ts`, `src/utils/formatters.ts`, `src/utils/errors.ts`
- [x] `src/services/api.ts`, `src/services/authService.ts`
- [x] `src/context/AuthContext.tsx`, `src/hooks/useAuth.ts`
- [x] `src/components/common/Button.tsx`, `Input.tsx`, `Card.tsx`, `Spinner.tsx`, `Badge.tsx`, `PageHeader.tsx`, `EmptyState.tsx`, `Modal.tsx`, `ConfirmDialog.tsx`, `Table.tsx`, `Pagination.tsx`
- [x] `src/components/layout/Sidebar.tsx`, `Navbar.tsx`, `MainLayout.tsx`
- [x] `src/routes/ProtectedRoute.tsx`, `src/routes/AppRoutes.tsx`
- [x] `src/pages/Login.tsx`
- [x] `src/pages/Dashboard.tsx` (shell only, "Welcome back" text)
- [x] `src/pages/NotFound.tsx`
- [x] Manual check: mobile drawer sidebar works

### Step 4 — Staff Management, My Profile, Settings placeholder
**Check:** Admin creates a Staff account, that Staff logs in and sees the Staff sidebar.
- [x] `backend/app/schemas/user.py` (add `UserCreate`, `UserUpdate`)
- [x] `backend/app/services/user_service.py`
- [x] `backend/app/routers/users.py`
- [x] Endpoint `POST /api/users`
- [x] Endpoint `GET /api/users`
- [x] Endpoint `GET /api/users/{id}`
- [x] Endpoint `PUT /api/users/{id}`
- [x] `backend/tests/test_users.py`
- [x] `src/services/userService.ts`
- [x] `src/pages/StaffManagement.tsx`
- [x] `src/pages/Profile.tsx`
- [x] `src/pages/Settings.tsx` (placeholder)

### Step 5 — Brands and Categories
**Check:** add, edit, delete unused; in-use delete is blocked with a clear message.
- [x] `backend/app/schemas/brand.py`, `category.py`
- [x] `backend/app/services/brand_service.py`, `category_service.py`
- [x] `backend/app/routers/brands.py`, `categories.py`
- [x] Endpoints `GET/POST /api/brands`, `PUT/DELETE /api/brands/{id}`
- [x] Endpoints `GET/POST /api/categories`, `PUT/DELETE /api/categories/{id}`
- [x] `backend/tests/test_brands_categories.py`
- [x] `src/types/catalog.ts`
- [x] `src/services/brandService.ts`, `categoryService.ts`
- [x] `src/pages/Brands.tsx`
- [x] `src/pages/Categories.tsx`

### Step 6 — Products
**Check:** Admin manages products; Staff only views; delete vs deactivate works.
- [x] `backend/app/schemas/product.py`
- [x] `backend/app/utils/pagination.py`
- [x] `backend/app/services/product_service.py`
- [x] `backend/app/routers/products.py`
- [x] Endpoint `GET /api/products`
- [x] Endpoint `GET /api/products/{id}`
- [x] Endpoint `POST /api/products`
- [x] Endpoint `PUT /api/products/{id}`
- [x] Endpoint `DELETE /api/products/{id}`
- [x] `backend/tests/test_products.py`
- [x] `src/types/product.ts`
- [x] `src/services/productService.ts`
- [] `src/hooks/useDebounce.ts`
- [] `src/components/common/Select.tsx`, `Textarea.tsx`
- [x] `src/components/products/ProductDetailsModal.tsx`
- [x] `src/pages/Products.tsx`
- [x] `src/pages/ProductForm.tsx`
### Step 7 — Stock In
- [x] `backend/app/schemas/stock_in.py`
- [x] `backend/app/services/stock_service.py` (stock-in function)
- [x] `backend/app/routers/stock_in.py`
- [x] Endpoint `POST /api/stock-in`
- [x] Endpoint `GET /api/stock-in`
- [x] `backend/tests/test_stock_in.py`
- [x] `src/types/stock.ts` (`StockIn`)
- [x] `src/services/stockService.ts` (stock-in calls)
- [x] `src/pages/StockIn.tsx`

### Step 8 — Sales
- [x] `backend/app/schemas/sale.py`
- [x] `backend/app/services/stock_service.py` (sale function)
- [x] `backend/app/routers/sales.py`
- [x] Endpoint `POST /api/sales`
- [x] Endpoint `GET /api/sales`
- [x] `backend/tests/test_sales.py` (including concurrent last-unit test)
- [x] `src/types/stock.ts` (`Sale`)
- [x] `src/services/stockService.ts` (sales calls)
- [x] `src/pages/Sales.tsx`

### Step 9 — History and Low Stock
- [x] `backend/app/schemas/history.py`
- [x] `backend/app/services/history_service.py`
- [x] `backend/app/routers/history.py`, `low_stock.py`
- [x] Endpoint `GET /api/history`
- [x] Endpoint `GET /api/low-stock`
- [x] `backend/tests/test_history_low_stock.py`
- [x] `src/types/stock.ts` (`HistoryItem`, `LowStockItem`)
- [x] `src/services/historyService.ts`
- [x] `src/pages/History.tsx`
- [x] `src/pages/LowStock.tsx`

### Step 10 — Dashboard
- [x] `backend/app/schemas/dashboard.py`
- [x] `backend/app/services/dashboard_service.py`
- [x] `backend/app/routers/dashboard.py`
- [x] Endpoint `GET /api/dashboard/summary`
- [x] `src/types/dashboard.ts`
- [x] `src/services/dashboardService.ts`
- [x] `src/components/dashboard/StatCard.tsx` (inline in Dashboard.tsx)
- [x] `src/pages/Dashboard.tsx` (full version)

### Step 11 — Reports
- [x] `backend/app/schemas/report.py`
- [x] `backend/app/services/report_service.py`
- [x] `backend/app/routers/reports.py`
- [x] Endpoint `GET /api/reports/current-stock`
- [x] Endpoint `GET /api/reports/low-stock`
- [x] Endpoint `GET /api/reports/stock-in`
- [x] Endpoint `GET /api/reports/sales`
- [x] Endpoint `GET /api/reports/sales-total`
- [x] `backend/tests/test_dashboard_reports.py`
- [x] `src/types/report.ts`
- [x] `src/services/reportService.ts`
- [x] `src/pages/Reports.tsx` (tabs and CSV export — no chart in v1)

### Step 12 — Final testing and cleanup
- [x] Full automated test run passes (`pytest`)
- [x] Manual walkthrough as Admin (every page)
- [x] Manual walkthrough as Staff (every page; Admin-only pages are blocked)
- [x] Staff calling Admin APIs directly returns 403
- [x] Responsive check: desktop, tablet, mobile
- [x] Loading, empty, confirm, success and error states checked on every page
- [x] Change first Admin password
- [x] README updated with final versions and run instructions
- [ ] Deployment checklist: managed PostgreSQL with backups, strong `SECRET_KEY`, HTTPS, CORS limited to the frontend URL

## 5.3 Installed versions (filled at Step 1 and Step 3)

| Package | Version |
|---|---|
| Python | `3.14.6` |
| fastapi | `0.162.5` |
| uvicorn | `0.54.0` |
| sqlalchemy | `2.0.57` |
| psycopg | `3.3.9` |
| pydantic / pydantic-settings | `2.14.3 / 2.16.2` |
| PyJWT | `2.15.1` |
| bcrypt | `5.0.0` |
| pytest / httpx | `9.2.0 / 0.28.1` |
| Frontend packages | *(fill after Step 3)* |


## 5.4 Open decisions and defaults to use until decided

| Topic | Default until the owner decides |
|---|---|
| Settings page | Admin-only placeholder page. No settings endpoints. |
| My Profile | Read-only. No password change. |
| Admin password reset for Staff | Not built. Admin can only create, edit name/email, and activate/deactivate Staff. |

## 5.5 Decisions log (add new decisions here)

- Sales: basic (product, quantity, price, date, staff).
- Only Admin manages products; Staff can view.
- Products with history: deactivate, not delete.
- Low stock rule: `quantity < min_stock_level`.
- Dates: plain `DATE` from form plus `created_at` timestamp.
- First Admin auto-created from `.env`; no script to run by hand.
- Build one module at a time (backend + frontend together).
- Tests: automated backend tests for critical rules plus a manual frontend checklist.
- Frontend language is TypeScript (strict); backend uses Pydantic v2 and SQLAlchemy 2.0.
- Light theme only; palette locked in Section 2.2.
- Money is sent as numbers and returned as 2-decimal strings.
- List endpoints return `{ items, total }`; large lists are paginated.
- My Profile opens from the navbar user name for both roles.
- Latest/flexible package versions used (owner decision, not README's exact pins).
- AI's Step 1+2 zip was incomplete (missing `users` router, `user_service.py`, `UserCreate`/`UserUpdate`, `test_users.py`) — completed manually.

## 5.6 Known bugs / notes
- `StarletteDeprecationWarning` on TestClient — harmless, ignore.
- `bcrypt 5.0.0` — 72-byte hard limit; `security.py` already handles it.
- `fastapi 0.162.5`, `pytest 9.2.0` — newer than README pins, all tests pass.
- `laptop_store_test` DB is test-only, safe to drop/recreate.

---

# 🔄 SECTION 6 — END-OF-CHAT HANDOFF PROTOCOL

**Rule for any AI reading this file:**

Whenever the owner says **"Generate Handoff Update"** (usually before the chat limit ends), the AI must output the **updated Section 5 — Live Progress Tracker & Current State**, so the owner can paste it into `README.md` for the next chat.

The output must contain, in this order:
1. The updated **📍 CURRENT HANDOFF STATUS** box (Last Completed Task, Next Immediate Task, Active Bugs / Notes, Last Updated).
2. Section **5.1** overall progress table.
3. Section **5.2** full checklist with `[x]` only for items the owner confirmed as working in this chat, and `[ ]` for everything else.
5. Section **5.4** open decisions (updated if the owner decided something).
6. Section **5.5** decisions log with any new decisions added.
7. Section **5.6** known bugs / notes.

Additional rules:
- Output **only** these updated parts in clean Markdown, in a single copy-paste block. Do not rewrite Sections 1 to 4.
- If the owner approved a change to the schema, API, folder tree or design in this chat, also output the exact changed lines for the affected section (2, 3 or 4) under the heading **"Locked Section Changes"**, and add the change to 5.5.
- Never mark an item `[x]` that was only written by the AI but not confirmed by the owner.
- The "Next Immediate Task" must name the exact next file or endpoint from Section 5.2, in order.

**Owner's quick commands**
- Start a new chat: upload this file and say **"Continue from the next unchecked task."**
- End a chat: say **"Generate Handoff Update."**
