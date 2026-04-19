# Booking Management — Test Strategy

> Feature area: Booking Management  
> Generated: 2026-04-19  
> Scenarios analysed: 59 (TC-001–TC-510)  
> Source: `docs/test-scenarios.md`, `backend/src/services/bookingService.js`, `backend/src/controllers/bookingController.js`

---

## Distribution Table

| Layer       | Count | Focus                                              | Est. Time |
|-------------|-------|----------------------------------------------------|-----------|
| Unit        | 5     | Pure functions extracted from `bookingService.js`  | <1s each  |
| API/Integration | 21 | Business rules, error contracts, security at HTTP  | 1–3s each |
| Component   | 0     | N/A — no component test runner configured          | —         |
| E2E         | 33    | Critical user journeys, UI state, client-side logic| 5–20s each|

> **Pyramid shape**: 5 unit → 21 API → 33 E2E ✓

---

## Unit Layer (5 tests)

These are pure functions with no I/O, extracted from source code analysis. They are **not listed as named scenarios** but must be covered for defence-in-depth on the most critical calculations.

| Function / Logic | Source | What to Test |
|-----------------|--------|--------------|
| `randomRef(eventTitle)` | `bookingService.js:11–18` | Prefix = `eventTitle[0].toUpperCase()`; code is 7 chars total; chars from `BOOKING_REF_CHARS` only |
| `totalPrice = parseFloat(event.price) * quantity` | `bookingService.js:99` | Integer × integer, decimal × integer, price=0 |
| `personalAvailable = Math.max(0, availableSeats - booked)` | `bookingService.js:87` | Cannot go negative; correct subtraction |
| `maxQty = Math.min(10, event.availableSeats)` | Frontend event detail component | Returns 10 when seats > 10; returns seats when seats < 10 |
| Refund eligibility: `quantity === 1` | Frontend booking detail component | qty=1 → eligible; qty>1 → ineligible |

---

## API / Integration Layer (21 tests)

All routed via `POST/GET/DELETE /api/bookings`. Auth enforced by `authMiddleware`. Business logic in `bookingService.js`.

### Happy Path (API)

| ID | Scenario | Endpoint | Justification |
|----|----------|----------|---------------|
| TC-009 | Booking ref prefix matches event title first char | `POST /api/bookings` | Pure backend rule (`randomRef()` + `generateUniqueRef()`); no UI needed to assert |
| TC-103 | totalPrice = price × quantity | `POST /api/bookings` | Calculated at `bookingService.js:99`; cheaper to assert on response JSON than render UI |
| TC-104 | Status is always "confirmed" on creation | `POST /api/bookings` | `prisma.booking.create` hardcodes `status: 'confirmed'`; assert once at API, not E2E |

### Business Rules (API)

| ID | Scenario | Endpoint | Justification |
|----|----------|----------|---------------|
| TC-100 | 10th booking triggers FIFO pruning (different-event) | `POST /api/bookings` | `bookingService.js:70–79` — `findOldestUserBookingExcludingEvent` path; complex state setup, API faster than E2E |
| TC-101 | 10th booking with all same-event triggers same-event fallback | `POST /api/bookings` | `sameEventFallback = true` branch in `bookingService.js:76`; requires precise count setup |
| TC-102 | Per-user seat availability uses only user's own bookings | `GET /api/events/:id` | `bookingService.js:86–87`; requires two-user state; API setup 10× faster than E2E |

### Security (API)

| ID | Scenario | Endpoint | Justification |
|----|----------|----------|---------------|
| TC-201 | Unauthenticated POST rejected (401) | `POST /api/bookings` | `authMiddleware` — HTTP contract; no browser needed |
| TC-202 | Cross-user GET by ID returns 403 | `GET /api/bookings/:id` | `getBookingById` → `ForbiddenError` at `bookingService.js:57`; assert error body + code |
| TC-204 | Cross-user DELETE returns 403 | `DELETE /api/bookings/:id` | `cancelBooking` → `ForbiddenError` at `bookingService.js:129`; assert error body + code |
| TC-205 | Cross-user GET by ref returns 403 | `GET /api/bookings/ref/:ref` | `getBookingByRef` → `ForbiddenError` at `bookingService.js:64` |

### Negative / Error (API)

| ID | Scenario | Endpoint | Justification |
|----|----------|----------|---------------|
| TC-305 | POST with non-existent eventId returns 404 | `POST /api/bookings` | `eventRepository.findById` → `NotFoundError` at `bookingService.js:83`; assert message + 404 |
| TC-307 | POST with quantity > personalAvailable returns error | `POST /api/bookings` | `InsufficientSeatsError` at `bookingService.js:89–92`; exact error message contract |
| TC-308 | DELETE non-existent booking ID returns 404 | `DELETE /api/bookings/:id` | `bookingRepository.findById` → `NotFoundError` at `bookingService.js:128` |

### Edge Cases (API)

| ID | Scenario | Endpoint | Justification |
|----|----------|----------|---------------|
| TC-401 | FIFO: oldest different-event booking pruned first | `POST /api/bookings` | `findOldestUserBookingExcludingEvent` call order at `bookingService.js:73`; assert correct record deleted |
| TC-402 | Multiple same-event bookings accumulate seat deductions | `GET /api/events/:id` | `getBookedQuantitiesForEvents` aggregation at `bookingService.js:86`; pure data assertion |
| TC-404 | Pagination: 11 bookings shows page 2 | `GET /api/bookings?page=2` | Pagination math `Math.ceil(total/limit)` at `bookingService.js:49`; no UI needed |
| TC-405 | Clear all when empty returns `{ deleted: 0 }` | `DELETE /api/bookings` | `deleteAllForUser` edge case; assert response body |
| TC-407 | Booking ref format matches `^[A-Z]-[A-Z0-9]{6}$` | `POST /api/bookings` | Regex on response; 5 events → 5 refs; faster than E2E loop |
| TC-409 | Same-event FIFO fallback permanently burns seat | `POST /api/bookings` → `GET /api/events/:id` | `eventRepository.decrementSeats` at `bookingService.js:96`; assert `availableSeats` decremented |

---

## E2E Layer (33 tests)

Full-stack journeys through the browser. Only scenarios that require multi-page navigation, JS-only client logic (refund, quantity cap), or UI-state rendering live here.

### Happy Path (E2E)

| ID | Scenario | Why E2E |
|----|----------|---------|
| TC-001 | Create single-ticket booking on static event | Full journey: /events → /events/:id → form → confirmation card |
| TC-002 | Create multi-ticket booking (qty=3) | Quantity stepper interaction + confirmation card data |
| TC-003 | View paginated bookings list | Navigates to /bookings; card rendering + status badge |
| TC-004 | View booking detail by ID | Click-through from /bookings → /bookings/:id; all sections visible |
| TC-005 | Booking detail shows correct payment summary | UI rendering of stored totalPrice/quantity |
| TC-006 | Cancel confirmed booking | Dialog interaction → toast → redirect to /bookings |
| TC-007 | Clear all bookings | Browser confirm() dialog → empty state |
| TC-008 | Confirmation card shows ref, name, total | BookingConfirmation component rendering |
| TC-010 | Pagination navigates to page 2 | URL update + different booking set rendered |

### Business Rules (E2E)

| ID | Scenario | Why E2E |
|----|----------|---------|
| TC-105 | Refund eligible (qty=1) — green result after 4s | Frontend-only `setTimeout` logic + spinner + result in DOM |
| TC-106 | Refund ineligible (qty>1) — red result after 4s | Same frontend-only logic path |
| TC-107 | Quantity `+` disables at min(10, availableSeats) when seats < 10 | `maxQty` in React component; button disabled state |
| TC-108 | Quantity `+` disables at 10 when seats > 10 | Same component; max indicator text "(max 10)" |
| TC-109 | Admin bookings page shows correct total count | pagination.total rendered in subtitle |

### Security (E2E)

| ID | Scenario | Why E2E |
|----|----------|---------|
| TC-200 | Unauthenticated user redirected from /bookings | AuthGuard client-side redirect — needs browser navigation |
| TC-203 | Cross-user /bookings/:id shows "Access Denied" UI | Frontend maps 403 → EmptyState component — UI assertion |
| TC-206 | Invalid JWT in localStorage redirects to /login | localStorage manipulation + AuthGuard redirect flow |

### Negative / Error Paths (E2E)

| ID | Scenario | Why E2E |
|----|----------|---------|
| TC-300 | Empty name shows "Name must be at least 2 chars" | Client-side `validate()` in booking form; no API call made |
| TC-301 | Single-char name rejected | Same client-side validator |
| TC-302 | Invalid email format shows error | Client-side email regex in booking form |
| TC-303 | Phone with <10 digits rejected | Client-side phone strip + length check |
| TC-304 | Minus button disabled at quantity=1 | Button disabled state in React component |
| TC-306 | Sold-out event disables form + shows "Sold Out" | `soldOut` prop drives button disabled + label change |
| TC-309 | API down shows error state with Retry button | `isError` state in useBookings hook → EmptyState |
| TC-310 | Non-existent booking ID shows "Booking not found" | 404 → not-found UI (distinct from 403 "Access Denied") |

### Edge Cases (E2E)

| ID | Scenario | Why E2E |
|----|----------|---------|
| TC-400 | Book last available seat — event shows sold out after | Requires booking then re-navigating to event; full flow |
| TC-403 | Exactly 10 bookings — no pagination shown | `totalPages === 1` hides Pagination component |
| TC-406 | Phone with formatting chars accepted (digits ≥ 10) | Client-side strip logic; verify booking created |
| TC-408 | Cancel from detail page redirects to /bookings list | `router.push('/bookings')` after mutation success |

### UI State (E2E)

| ID | Scenario | Why E2E |
|----|----------|---------|
| TC-500 | Empty state — no bookings | SVG icon + heading + Browse Events CTA rendering |
| TC-501 | Loading skeletons shown during fetch | `isLoading` → 5 skeleton cards; slow-network simulation |
| TC-502 | Error state with Retry button | `isError` → EmptyState; Retry button visible |
| TC-503 | Retry button re-fetches successfully | Click Retry → loading → bookings rendered |
| TC-504 | "Clear all" shows confirm dialog; cancelling aborts | `window.confirm()` intercept; no delete without confirm |
| TC-505 | Cancel booking dialog shows bookingRef + quantity | ConfirmDialog modal content |
| TC-506 | Dismissing cancel dialog leaves booking intact | `setConfirm(false)` — no mutation; booking still shows |
| TC-507 | Sold-out event shows "SOLD OUT" badge in red | `availableSeats === 0` → red badge text |
| TC-508 | Low seats (≤10) shows amber colour | `availableSeats <= 10` → `text-amber-600` class |
| TC-509 | Refund spinner visible for ~4s | `data-testid="refund-spinner"` visible then replaced by `refund-result` |
| TC-510 | Admin bookings filter by "Confirmed" status | Dropdown filter → table filtered; Cancel column visible |

---

## Anti-Patterns Found in Existing Tests

### 1. TC-102 in `tests/booking-management.spec.js` tests booking ref at E2E

**File**: `tests/booking-management.spec.js:156–168`  
**Problem**: The spec validates `bookingRef` format via Playwright — an API business rule (`randomRef()` in `bookingService.js:11–18`) tested through a full browser session.  
**Fix**: Keep TC-009 as an API test. Remove the regex assertion from the E2E spec or demote it to a soft assertion.

### 2. Form validation (TC-300–TC-303) tested at E2E only — no API coverage

**Problem**: Client-side `validate()` prevents the API call, so the backend validators are never hit by these E2E tests. If a developer removes backend validation, all four tests would still pass.  
**Fix**: Add API-layer tests that POST malformed payloads directly to `POST /api/bookings` (empty name, bad email, short phone) and assert 400 responses from the backend validator.

### 3. TC-005 tests pure price math at E2E

**Problem**: `totalPrice = parseFloat(event.price) * quantity` (`bookingService.js:99`) is a pure calculation verified only by rendering the booking detail page. A regression in this formula requires a full E2E run to catch.  
**Fix**: Add a unit test for the multiplication (covered in the Unit layer above) so a broken formula is caught in milliseconds, not seconds.

---

## Decision Rationale — Contested Assignments

| ID | Original Suggestion | Final Layer | Reason |
|----|--------------------|-----------  |--------|
| TC-009 | API ✓ | API | `generateUniqueRef` calls DB; assert prefix on response JSON. E2E version (TC-102 in spec) is redundant. |
| TC-102 (scenario) | API ✓ | API | Two-user state (User A + User B) is hard to orchestrate in Playwright; API setup is 10× faster. |
| TC-105 / TC-106 | E2E ✓ | E2E | `setTimeout` + DOM state — no backend involved; must be E2E. No value in unit-testing a 4s fake delay. |
| TC-200 | E2E ✓ | E2E | AuthGuard redirect is client-side Next.js middleware — requires real browser navigation to observe. |
| TC-300–TC-303 | E2E ✓ | E2E + **gap** | Client-side `validate()` is correctly E2E. But backend validators are untested — add API-layer negatives (see anti-pattern #2). |
| TC-401 / TC-409 | API ✓ | API | FIFO logic at `bookingService.js:70–97` depends on exact booking counts; state setup at API level is deterministic and fast. |
