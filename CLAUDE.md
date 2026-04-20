# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EventHub is a full-stack event ticket booking platform built for QA training. Each user operates in an isolated sandbox — they see shared static events plus their own dynamic events and bookings.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, React Query v5
- **Backend**: Express.js, Prisma ORM, MySQL 8+
- **Auth**: JWT (7-day expiry), bcryptjs
- **Testing**: Playwright E2E (Chromium only)

## Commands

```bash
npm run dev          # Start frontend (3000) + backend (3001) concurrently
npm run setup        # Install deps for both backend and frontend
npm run db:push      # Sync Prisma schema to DB (no migration files)
npm run migrate      # Create + apply Prisma migrations (tracks history)
npm run seed         # Seed 10 static events
npm run test         # Run all Playwright tests
npm run test:ui      # Playwright with UI mode
npm run test:report  # Open last HTML report
npx playwright test tests/<file>.spec.js --reporter=line  # Run single test file
```

## Architecture

### Backend (port 3001)

Layered: **Routes → Controllers → Services → Repositories → Prisma → MySQL**

All routes under `/api/`. Swagger UI at `/api/docs`.

| Resource | Endpoints                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Auth     | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`                                                                    |
| Events   | `GET /events`, `GET /events/:id`, `POST /events`, `PUT /events/:id`, `DELETE /events/:id`                                    |
| Bookings | `GET /bookings`, `GET /bookings/:id`, `GET /bookings/ref/:ref`, `POST /bookings`, `DELETE /bookings/:id`, `DELETE /bookings` |

`authMiddleware` enforces JWT on all events and bookings routes. A global error handler formats all exceptions.

### Frontend (port 3000)

Next.js App Router. Auth state lives in `AuthProvider` (React Context) — token persisted in `localStorage` as `eventhub_token`. Server state via React Query.

Key route protection: `AuthGuard` component wraps protected pages and redirects unauthenticated users to `/login`.

### Data Models (Prisma)

- **User** — `id`, `email` (unique), `password`, `createdAt`
- **Event** — `id`, `title`, `description`, `category`, `venue`, `city`, `eventDate`, `price`, `totalSeats`, `availableSeats`, `imageUrl` (optional), `isStatic` (true = seeded, immutable), `userId` (nullable FK), `createdAt`, `updatedAt`
- **Booking** — `id`, `eventId`, `userId`, `customerName`, `customerEmail`, `customerPhone`, `quantity`, `totalPrice`, `status`, `bookingRef` (unique), `createdAt`, `updatedAt`

## Business Rules

- **Events**: max 6 user-created per user (FIFO pruning on overflow); static events are immutable
- **Bookings**: max 9 per user (FIFO pruning on overflow — prefers pruning different-event bookings first)
- **Seats**: per-user available seats = `totalSeats - sum(user's bookings on that event)`
- **Booking ref**: first character = event title first character (uppercase), e.g. `T-XXXXXX`
- **Refund eligibility**: quantity = 1 → eligible; quantity > 1 → not eligible (client-side only)
- **Cross-user access**: returns "Access Denied" (not 404)

## Testing Conventions

- Test files: `tests/<feature-name>.spec.js`
- Base URL: configured in `playwright.config.ts` (defaults to `http://localhost:3000`)
- Locator priority: `data-testid` > role > label/placeholder > ID > CSS class
- No `page.waitForTimeout()` — use `expect().toBeVisible()`
- Tests must be self-contained: login → action → assert
- Test accounts: `admin@test.com` / `TestXacfub123%`
- Test scenarios documented in `docs/test-scenarios.md` (53 scenarios, TC-001 to TC-510)
- Test strategy in `docs/test-strategy.md` (unit / API / component / E2E breakdown)

## Custom Slash Commands

- `/generate-tests <feature>` — generates Playwright tests
- `/review-tests <file>` — reviews test code quality
- `/create-scenarios <area>` — creates test scenario documents
- `/test-strategy <scenarios>` — assigns tests to optimal pyramid layers

## Environment Variables

**Backend** (`backend/.env`):

- `DATABASE_URL` — MySQL connection string
- `PORT` — server port (3001)
- `CORS_ORIGIN` — frontend origin
- `JWT_SECRET` — token signing key
- `SHOW_EXPLORE_LINKS` — feature flag (boolean, default false)

**Frontend** (`frontend/.env.local`):

- `NEXT_PUBLIC_API_URL` — backend API base URL
