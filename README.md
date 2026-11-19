# Laptop Inventory Management System (LIMS)

A modern, full-stack, role-based web application designed to streamline laptop inventory, track stock movements (Stock-In / Sales), and generate actionable business reports.

Built with **FastAPI** (Backend) and **React + TypeScript** (Frontend), backed by a cloud-hosted **PostgreSQL** database.

---

## Key Features

- ** Secure Authentication & Roles:** JWT-based login with separate **Admin** and **Staff** access levels. Strict backend role enforcement.
- ** Product Management:** Admins can seamlessly add, update, delete, or deactivate laptops. Staff gets a clean, read-only view.
- ** Brands & Categories:** Fully integrated taxonomy system with in-use delete protection (prevents accidental data loss).
- ** Stock In (Procurement):** Record incoming inventory with supplier notes and purchase prices. Automatically updates stock levels safely using database row-locking.
- ** Sales Management:** Record laptop sales with auto-calculated totals and price-snapshotting. Includes **strict overselling protection** (Stock can never go negative).
- ** Stock History:** A unified, immutable timeline of all stock-in and sales activities.
- ** Low Stock Alerts:** Smart monitoring that highlights items falling below their minimum stock thresholds.
- ** Dashboard & Analytics:** Interactive dashboard with real-time stat cards, recent activity feeds, and one-click CSV exports for Reports.

---

## Tech Stack

**Frontend:**
- React 18 & TypeScript (Strict Mode)
- Vite (Build Tool)
- Tailwind CSS 3.4 (Modern UI)
- React Router 6 (Routing)
- React Hook Form & React Hot Toast

**Backend:**
- Python 3.14 & FastAPI
- SQLAlchemy 2.0 (ORM)
- Pydantic v2 (Data Validation)
- PostgreSQL (Neon Cloud DB)
- JWT (PyJWT) & Bcrypt (Security)
- Pytest (96 Automated Tests)

---

## Live Demo & Deployment

- **Frontend Hosting:** [Vercel](https://vercel.com)
- **Backend Hosting:** [Render](https://render.com)
- **Database:** [Neon](https://neon.tech) (Serverless Postgres)

*(Note: If you are cloning this repo, ensure you add your own `.env` file based on `.env.example` to connect to your database).*

---

## Project Structure

```text
laptop-store/
├── backend/            # FastAPI Application
│   ├── app/            # Main application code (models, routers, services)
│   ├── tests/          # 96+ Pytest automated tests
│   └── requirements.txt
└── frontend/           # React + TypeScript Application
    ├── src/            # Components, Pages, Context, Services
    └── package.json