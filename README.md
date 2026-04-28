# Spendly — Modern Finance Management SaaS

Spendly is a modern full-stack personal finance management platform built with Next.js and Supabase.

The application helps users manage:

* accounts
* transactions
* budgets
* recurring payments
* financial analytics

with a clean modern SaaS experience.

---

## Live Demo

### Production

Add your deployed URL here.

```bash
https://spendly-ashy.vercel.app
```

---

## Features

### Authentication

* Email & Password authentication
* Google OAuth login
* Protected routes
* SSR authentication with Supabase

### Dashboard Analytics

* Financial overview dashboard
* Income vs expense analytics
* Expense category breakdown
* Recent transaction tracking

### Accounts

* Multiple account management
* Account balances
* Account categorization
* Archive support

### Transactions

* Income & expense tracking
* Category-based organization
* Transaction filtering
* Notes & history

### Budgets

* Monthly/yearly budgets
* Budget progress tracking
* Overspending alerts
* Budget analytics

### Recurring Transactions

* Automated recurring income/expenses
* Schedule management
* Frequency-based automation
* Cron-ready recurring processing

### UX & Design

* Responsive modern SaaS UI
* Dark mode support
* Skeleton loading states
* Premium fintech-inspired design
* Fully componentized architecture

---

## Tech Stack

### Frontend

* Next.js App Router
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Hook Form
* Zod
* Lucide Icons
* date-fns

### Backend

* Supabase
* PostgreSQL
* Supabase SSR
* Row Level Security (RLS)

### Deployment

* Vercel

---

## Architecture Highlights

* App Router architecture
* Service-layer based backend structure
* Strongly typed APIs
* Reusable validation system
* Modular component decomposition
* Protected SSR layouts
* Structured API responses
* Clean domain separation

---

## Project Structure

```bash
app/
components/
types/
utils/
  services/
  validations/
```

---

## Screenshots

Add screenshots here.

Recommended:

* Landing page
* Dashboard
* Budgets
* Recurring transactions
* Mobile responsive view

---

## Local Development

### Clone the repository

```bash
git clone https://github.com/itskrishnaprasad/spendly.git
```

### Install dependencies

```bash
pnpm install
```

### Create environment variables

Create:

```bash
.env.local
```

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### Run development server

```bash
pnpm run dev
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

---

## Future Improvements

* CSV export
* AI-powered financial insights
* Notifications system
* Advanced analytics
* Mobile app version

---

## Author

Built by Krishna Prasad.

---

## License

MIT License.
