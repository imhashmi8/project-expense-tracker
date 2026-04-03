# ExpenseFlow

ExpenseFlow is a three-tier Expense Tracker SaaS starter built for Azure DevOps learning and interview preparation.

## Stack

- Tier 1: Next.js frontend
- Tier 2: FastAPI backend with JWT auth, RBAC, analytics, reports, notifications, and receipt upload hooks
- Tier 3: PostgreSQL, Redis, and Azure Blob Storage abstraction

## Features

- Login flow with seeded demo users
- Expense CRUD APIs
- Budget analytics dashboard
- Team expense reporting
- Async notification persistence
- Redis-backed analytics cache
- Dockerfiles and local `docker-compose.yml`
- Azure Pipelines starter YAML

## Demo Users

- `admin@northstar.dev / Admin@123`
- `manager@northstar.dev / Manager@123`
- `employee@northstar.dev / Employee@123`

## Local Run

### Backend

1. Copy [backend/.env.example](/Users/mdqamarhashmi/Documents/Projects/untitled%20folder/backend/.env.example) to `backend/.env`
2. Create a virtual environment and install dependencies
3. Run `uvicorn app.main:app --reload` from the `backend` folder

### Frontend

1. Copy [frontend/.env.local.example](/Users/mdqamarhashmi/Documents/Projects/untitled%20folder/frontend/.env.local.example) to `frontend/.env.local`
2. Run `npm install`
3. Run `npm run dev` from the `frontend` folder

### Full Stack With Containers

Run `docker compose up --build`

Frontend: `http://localhost:3000`

Backend API: `http://localhost:8000`

## API Areas

- `/api/auth`
- `/api/expenses`
- `/api/budgets`
- `/api/analytics`
- `/api/reports`
- `/api/notifications`
- `/api/uploads`

## Azure DevOps Next


