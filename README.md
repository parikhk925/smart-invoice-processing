# Smart Invoice Processing System — InvoiceVision

A college project (Summer Internship / Computer Engineering, GTU) demonstrating an
AI-assisted invoice management SaaS: upload an invoice, have its fields extracted
automatically, review AI-generated insights, and move it through an approval
workflow — with a dashboard and analytics on top.

This build follows the features and pages described in the project report and
presentation (abstract, objectives, database design, UI pages, workflow), but
keeps the implementation simple and free to run:

- **No paid cloud services required.** The report's target architecture uses
  Azure AI Document Intelligence, Azure OpenAI, Azure SQL Database, Azure Blob
  Storage, and Azure AD B2C. For this demo, those are replaced with equivalent
  client-side logic — simulated OCR extraction, a template-based "AI insights"
  generator, and `localStorage` in place of a database — so the whole app runs
  entirely in the browser and deploys for free on Vercel.
- **Everything else matches the report**: the Draft → Pending →
  Approved/Rejected → Paid workflow, the dashboard/invoices/upload/analytics/
  notifications/profile/settings pages, search & filters, CSV export, and the
  Azure Portal-inspired UI.

## Tech stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Recharts (dashboard & analytics charts)
- lucide-react (icons)
- Browser `localStorage` as the data layer (users, invoices, notifications)

## Features

- Sign up / sign in (demo auth, stored in `localStorage`)
- Dashboard with KPI cards, monthly spend trend, and status breakdown
- Drag-and-drop invoice upload (PDF/PNG/JPG) with simulated AI extraction
- Editable invoice detail page with line items and AI insights (summary,
  payment recommendation, risk flag, duplicate/anomaly detection)
- Approval workflow: Draft → Pending → Approved/Rejected → Paid
- Invoice list with search, status filter, and CSV export
- Analytics: monthly trend, category & vendor breakdown, paid vs. pending, tax summary
- Notifications feed
- Profile page and a Settings page with a working light/dark mode toggle

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up with any name/email/
password — a few sample invoices are seeded automatically so the dashboard and
analytics aren't empty on first login.

## Deployment

Deployed on Vercel — push to `main` and Vercel builds automatically. No
environment variables are required.

## Project background

Based on the "Smart Invoice Processing System" project report and summer
internship presentation (GTU / SAL College of Engineering, Computer
Engineering). See the original report for the full target architecture,
database schema, and objectives.
