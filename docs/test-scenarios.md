# Booking Management — Test Scenarios

> Feature area: Booking Management  
> Generated: 2026-04-19  
> Total scenarios: 53 (TC-001–TC-510)

---

## Happy Path (TC-001 – TC-099)

### TC-001: Create a single-ticket booking on a static event

**Category**: Happy Path  
**Priority**: P0  
**Preconditions**: Logged-in user; static event exists with ≥1 available seat  
**Steps**:

1. Navigate to `/events`
2. Click on any featured (static) event
3. Fill in Full Name (≥2 chars), valid Email, valid 10-digit Phone
4. Leave Tickets = 1, click **Confirm Booking**
   **Expected Results**: Booking Confirmation card appears; booking ref shown (format `X-XXXXXX` where X = first char of event title); `View My Bookings` link available  
   **Business Rule**: Booking is created with status "confirmed"; totalPrice = price × 1  
   **Suggested Layer**: E2E

---

### TC-002: Create a multi-ticket booking on a static event

**Category**: Happy Path  
**Priority**: P0  
**Preconditions**: Logged-in user; static event with ≥3 available seats  
**Steps**:

1. Navigate to event detail page
2. Click `+` button to increase quantity to 3
3. Fill in customer details, click **Confirm Booking**
   **Expected Results**: Confirmation card shows quantity = 3; totalPrice = price × 3; booking ref prefix matches event title first char  
   **Business Rule**: totalPrice = event.price × quantity  
   **Suggested Layer**: E2E

---

### TC-003: View paginated bookings list

**Category**: Happy Path  
**Priority**: P0  
**Preconditions**: Logged-in user with at least 1 booking  
**Steps**:

1. Navigate to `/bookings`
   **Expected Results**: Booking cards displayed; each card shows booking ref, event name, status badge; "Clear all bookings" link visible  
   **Business Rule**: GET /bookings returns user's own bookings only, paginated (limit=10)  
   **Suggested Layer**: E2E

---

### TC-004: View booking detail by ID

**Category**: Happy Path  
**Priority**: P0  
**Preconditions**: Logged-in user with at least 1 existing booking  
**Steps**:

1. Navigate to `/bookings`
2. Click on a booking card to open detail page (`/bookings/:id`)
   **Expected Results**: Detail page shows Event Details, Customer Details, Payment Summary, Refund section, Booking Information; Cancel Booking button visible; booking ref shown in breadcrumb  
   **Business Rule**: GET /bookings/:id returns full booking detail for authenticated owner  
   **Suggested Layer**: E2E

---

### TC-005: View booking detail page shows correct payment summary

**Category**: Happy Path  
**Priority**: P1  
**Preconditions**: Logged-in user; booking with quantity=2, price=$50 exists  
**Steps**:

1. Open booking detail for that booking
   **Expected Results**: "Price per ticket" = $50; "Total Paid" = $100; quantity = 2  
   **Business Rule**: totalPrice = event.price × quantity (stored at creation time)  
   **Suggested Layer**: E2E

---

### TC-006: Cancel a confirmed booking

**Category**: Happy Path  
**Priority**: P0  
**Preconditions**: Logged-in user with at least 1 confirmed booking  
**Steps**:

1. Open booking detail page
2. Click **Cancel Booking**
3. In the confirmation dialog, click **Yes, cancel it**
   **Expected Results**: Success toast "Booking cancelled successfully"; redirected to `/bookings`; cancelled booking no longer appears in list  
   **Business Rule**: DELETE /bookings/:id removes the booking; seats released for dynamic events  
   **Suggested Layer**: E2E

---

### TC-007: Clear all bookings

**Category**: Happy Path  
**Priority**: P1  
**Preconditions**: Logged-in user with ≥2 bookings  
**Steps**:

1. Navigate to `/bookings`
2. Click **Clear all bookings**
3. Confirm the browser confirm dialog
   **Expected Results**: All bookings removed; empty state displayed with "No bookings yet" message and Browse Events CTA  
   **Business Rule**: DELETE /bookings removes all user's bookings; returns `{ deleted: N }`  
   **Suggested Layer**: E2E

---

### TC-008: Booking confirmation card shows correct reference and details

**Category**: Happy Path  
**Priority**: P1  
**Preconditions**: Logged-in user; valid event available  
**Steps**:

1. Complete a valid booking (quantity=2)
   **Expected Results**: Confirmation card shows: bookingRef (element `.booking-ref`), customerName, quantity=2, correct total; "View My Bookings" and "Browse More Events" buttons present  
   **Business Rule**: BookingConfirmation component renders booking.data fields  
   **Suggested Layer**: E2E

---

### TC-009: Booking reference prefix matches event title first character

**Category**: Happy Path  
**Priority**: P1  
**Preconditions**: Logged-in user; event with title starting with "T" (e.g., "Tech Summit")  
**Steps**:

1. Create a booking for that event
   **Expected Results**: bookingRef starts with "T-"  
   **Business Rule**: Booking ref first char = event title first char (uppercase)  
   **Suggested Layer**: API

---

### TC-010: Bookings list pagination navigates correctly

**Category**: Happy Path  
**Priority**: P2  
**Preconditions**: Logged-in user with >10 bookings (or seeded data); page=1  
**Steps**:

1. Navigate to `/bookings`
2. Click the next page button in Pagination component
   **Expected Results**: URL updates to `?page=2`; different set of bookings displayed; page indicator reflects current page  
   **Business Rule**: GET /bookings supports `page` and `limit` query params  
   **Suggested Layer**: E2E

---

## Business Rules (TC-100 – TC-199)

### TC-100: 10th booking triggers FIFO pruning of oldest different-event booking

**Category**: Business Rule  
**Priority**: P0  
**Preconditions**: Logged-in user with exactly 9 bookings across multiple events  
**Steps**:

1. Create a 10th booking for a new event
   **Expected Results**: New booking is created successfully; oldest booking from a _different_ event is silently removed; user still has 9 bookings total  
   **Business Rule**: Max 9 bookings per user; FIFO pruning prefers removing oldest booking from a different event  
   **Suggested Layer**: API

---

### TC-101: 10th booking with all existing bookings on same event triggers same-event FIFO pruning

**Category**: Business Rule  
**Priority**: P0  
**Preconditions**: Logged-in user with 9 bookings all on the same event  
**Steps**:

1. Create a 10th booking for that same event
   **Expected Results**: Oldest same-event booking is pruned; new booking created; `availableSeats` for the event is permanently decremented (seats burned)  
   **Business Rule**: sameEventFallback path: `eventRepository.decrementSeats` called; seat is permanently consumed  
   **Suggested Layer**: API

---

### TC-102: Per-user seat availability is computed from user's own bookings only

**Category**: Business Rule  
**Priority**: P0  
**Preconditions**: Event with 100 totalSeats; User A has 5 booked; User B has 3 booked  
**Steps**:

1. Log in as User A; navigate to event detail
   **Expected Results**: Available seats shown = 95 (totalSeats - User A's 5 bookings); User B's bookings do NOT reduce User A's view  
   **Business Rule**: availableSeats = totalSeats - sum(user's bookings on that event)  
   **Suggested Layer**: API

---

### TC-103: Total price is calculated as price × quantity at booking creation

**Category**: Business Rule  
**Priority**: P1  
**Preconditions**: Event price = $75; user books 4 tickets  
**Steps**:

1. Create booking with quantity=4 for a $75 event
   **Expected Results**: booking.totalPrice = $300 (stored; not affected by subsequent price changes)  
   **Business Rule**: totalPrice = parseFloat(event.price) \* quantity  
   **Suggested Layer**: API

---

### TC-104: Booking status is always "confirmed" on creation

**Category**: Business Rule  
**Priority**: P1  
**Preconditions**: Logged-in user; valid event  
**Steps**:

1. Create a booking via API POST /bookings
   **Expected Results**: Response includes `status: "confirmed"`; no other status possible at creation  
   **Business Rule**: Prisma create always sets status = 'confirmed'  
   **Suggested Layer**: API

---

### TC-105: Refund eligibility — quantity=1 booking is eligible

**Category**: Business Rule  
**Priority**: P1  
**Preconditions**: Logged-in user; booking with quantity=1 exists  
**Steps**:

1. Open booking detail page (`/bookings/:id`)
2. Click **Check eligibility for refund?**
3. Wait ~4 seconds
   **Expected Results**: Green success box appears with text "Eligible for refund. Single-ticket bookings qualify for a full refund."  
   **Business Rule**: quantity === 1 → eligible (client-side only, 4s simulated delay)  
   **Suggested Layer**: E2E

---

### TC-106: Refund eligibility — quantity>1 booking is not eligible

**Category**: Business Rule  
**Priority**: P1  
**Preconditions**: Logged-in user; booking with quantity=3 exists  
**Steps**:

1. Open booking detail page
2. Click **Check eligibility for refund?**
3. Wait ~4 seconds
   **Expected Results**: Red error box: "Not eligible for refund. Group bookings (3 tickets) are non-refundable."  
   **Business Rule**: quantity > 1 → ineligible (client-side only)  
   **Suggested Layer**: E2E

---

### TC-107: Ticket quantity selector is capped at min(10, availableSeats)

**Category**: Business Rule  
**Priority**: P1  
**Preconditions**: Event with exactly 3 available seats  
**Steps**:

1. Navigate to event detail page
2. Click `+` to increase quantity
   **Expected Results**: `+` button becomes disabled at quantity=3; max indicator shows "(max 3)"; cannot increment further  
   **Business Rule**: maxQty = Math.min(10, event.availableSeats)  
   **Suggested Layer**: E2E

---

### TC-108: Ticket quantity selector max is 10 when availableSeats > 10

**Category**: Business Rule  
**Priority**: P2  
**Preconditions**: Event with 50 available seats  
**Steps**:

1. Open event detail, click `+` repeatedly
   **Expected Results**: `+` button disables at quantity=10; max indicator shows "(max 10)"  
   **Business Rule**: maxQty = Math.min(10, event.availableSeats)  
   **Suggested Layer**: E2E

---

### TC-109: Admin bookings page shows total booking count

**Category**: Business Rule  
**Priority**: P2  
**Preconditions**: Logged-in user with bookings; navigate to `/admin/bookings`  
**Steps**:

1. Navigate to `/admin/bookings`
   **Expected Results**: Subtitle shows correct total (e.g., "5 total bookings"); table lists all user's bookings with Ref, Customer, Event, Qty, Total, Status, Date columns  
   **Business Rule**: pagination.total reflects total count from paginated response  
   **Suggested Layer**: E2E

---

## Security (TC-200 – TC-299)

### TC-200: Unauthenticated user is redirected from bookings list

**Category**: Security  
**Priority**: P0  
**Preconditions**: No active session / logged out  
**Steps**:

1. Navigate to `/bookings`
   **Expected Results**: Redirected to `/login`; bookings data not accessible  
   **Business Rule**: AuthGuard redirects unauthenticated users; authMiddleware enforces JWT on all booking routes  
   **Suggested Layer**: E2E

---

### TC-201: Unauthenticated POST /bookings is rejected

**Category**: Security  
**Priority**: P0  
**Preconditions**: No JWT token  
**Steps**:

1. Send POST /api/bookings with valid payload but no Authorization header
   **Expected Results**: 401 Unauthorized response  
   **Business Rule**: authMiddleware enforces JWT on all /bookings routes  
   **Suggested Layer**: API

---

### TC-202: User cannot view another user's booking by ID (403)

**Category**: Security  
**Priority**: P0  
**Preconditions**: User A and User B both have bookings; User B's booking ID known  
**Steps**:

1. Log in as User A
2. GET /api/bookings/:id where id belongs to User B
   **Expected Results**: 403 Forbidden; "You are not authorized to view this booking"  
   **Business Rule**: getBookingById checks booking.userId !== userId → ForbiddenError  
   **Suggested Layer**: API

---

### TC-203: Booking detail page shows "Access Denied" for cross-user access

**Category**: Security  
**Priority**: P0  
**Preconditions**: User A is logged in; User B's booking ID known  
**Steps**:

1. Navigate to `/bookings/:id` where id belongs to User B
   **Expected Results**: EmptyState shown with title "Access Denied" and description "You are not authorized to view this booking." (not a 404)  
   **Business Rule**: Frontend maps 403 status to "Access Denied" UI  
   **Suggested Layer**: E2E

---

### TC-204: User cannot cancel another user's booking

**Category**: Security  
**Priority**: P0  
**Preconditions**: User A is logged in; User B's booking ID known  
**Steps**:

1. Send DELETE /api/bookings/:id where id belongs to User B
   **Expected Results**: 403 Forbidden; "You do not own this booking"  
   **Business Rule**: cancelBooking checks booking.userId !== userId → ForbiddenError  
   **Suggested Layer**: API

---

### TC-205: User cannot retrieve another user's booking by reference

**Category**: Security  
**Priority**: P1  
**Preconditions**: User A logged in; User B's bookingRef known  
**Steps**:

1. Send GET /api/bookings/ref/:ref using User B's reference
   **Expected Results**: 403 Forbidden; "You do not own this booking"  
   **Business Rule**: getBookingByRef checks ownership before returning  
   **Suggested Layer**: API

---

### TC-206: Expired or invalid JWT token is rejected

**Category**: Security  
**Priority**: P1  
**Preconditions**: User has an expired/invalid token in localStorage  
**Steps**:

1. Manually set an invalid `eventhub_token` in localStorage
2. Navigate to `/bookings`
   **Expected Results**: Redirected to `/login`; no booking data exposed  
   **Business Rule**: authMiddleware validates JWT; AuthGuard handles client-side redirect  
   **Suggested Layer**: E2E

---

## Negative / Error Paths (TC-300 – TC-399)

### TC-300: Booking form — empty customer name shows validation error

**Category**: Negative  
**Priority**: P1  
**Preconditions**: Logged-in user on event detail page  
**Steps**:

1. Leave Full Name blank
2. Fill valid email and phone, click **Confirm Booking**
   **Expected Results**: Form does NOT submit; error message "Name must be at least 2 chars" shown under Full Name field  
   **Business Rule**: validate() checks customerName.trim() && length ≥ 2  
   **Suggested Layer**: E2E

---

### TC-301: Booking form — single character name is rejected

**Category**: Negative  
**Priority**: P2  
**Preconditions**: Logged-in user on event detail page  
**Steps**:

1. Enter "A" as Full Name; valid email and phone
2. Click **Confirm Booking**
   **Expected Results**: Validation error "Name must be at least 2 chars"; no API call made  
   **Business Rule**: customerName.length < 2 → validation failure  
   **Suggested Layer**: E2E

---

### TC-302: Booking form — invalid email format shows error

**Category**: Negative  
**Priority**: P1  
**Preconditions**: Logged-in user on event detail page  
**Steps**:

1. Enter "notanemail" in Email field; valid name and phone
2. Click **Confirm Booking**
   **Expected Results**: Validation error "Enter a valid email"; form not submitted  
   **Business Rule**: email must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`  
   **Suggested Layer**: E2E

---

### TC-303: Booking form — phone with fewer than 10 digits is rejected

**Category**: Negative  
**Priority**: P1  
**Preconditions**: Logged-in user on event detail page  
**Steps**:

1. Enter "123456789" (9 digits) in Phone field; valid name and email
2. Click **Confirm Booking**
   **Expected Results**: Validation error "Enter a valid 10-digit phone"; form not submitted  
   **Business Rule**: phone.replace(/\D/g, '').length < 10 → validation failure  
   **Suggested Layer**: E2E

---

### TC-304: Booking form — minus button disabled at quantity=1

**Category**: Negative  
**Priority**: P2  
**Preconditions**: Logged-in user on event detail page; quantity = 1 (default)  
**Steps**:

1. Attempt to click `−` button
   **Expected Results**: `−` button is disabled (not clickable); quantity stays at 1  
   **Business Rule**: quantity minimum = 1  
   **Suggested Layer**: E2E

---

### TC-305: Booking a non-existent event returns 404

**Category**: Negative  
**Priority**: P1  
**Preconditions**: Logged-in user  
**Steps**:

1. POST /api/bookings with eventId=999999 (non-existent)
   **Expected Results**: 404 response; "Event with id 999999 not found"  
   **Business Rule**: eventRepository.findById returns null → NotFoundError thrown  
   **Suggested Layer**: API

---

### TC-306: Booking a sold-out event shows "Sold Out" and disables form

**Category**: Negative  
**Priority**: P0  
**Preconditions**: Logged-in user; event with availableSeats=0  
**Steps**:

1. Navigate to a sold-out event detail page
   **Expected Results**: "Confirm Booking" button is disabled and shows "Sold Out"; quantity +/− shows "(max 0)"; quantity defaults disabled  
   **Business Rule**: soldOut = event.availableSeats === 0; button disabled  
   **Suggested Layer**: E2E

---

### TC-307: Requesting more seats than available returns 409/error

**Category**: Negative  
**Priority**: P0  
**Preconditions**: Logged-in user; event with 2 personal available seats  
**Steps**:

1. POST /api/bookings with quantity=5 for that event
   **Expected Results**: Error response: "Only 2 seat(s) available, but 5 requested"; booking not created  
   **Business Rule**: InsufficientSeatsError when personalAvailable < quantity  
   **Suggested Layer**: API

---

### TC-308: Cancel a non-existent booking returns 404

**Category**: Negative  
**Priority**: P2  
**Preconditions**: Logged-in user  
**Steps**:

1. DELETE /api/bookings/999999
   **Expected Results**: 404 response; "Booking with id 999999 not found"  
   **Business Rule**: bookingRepository.findById returns null → NotFoundError  
   **Suggested Layer**: API

---

### TC-309: Fetch booking list when API is down shows error state

**Category**: Negative  
**Priority**: P1  
**Preconditions**: Logged-in user; API server is down  
**Steps**:

1. Navigate to `/bookings`
   **Expected Results**: EmptyState with title "Couldn't load bookings" and description "Failed to connect to the server. Please try again."; Retry button present  
   **Business Rule**: isError state renders fallback EmptyState  
   **Suggested Layer**: E2E

---

### TC-310: Navigating to non-existent booking ID shows "Booking not found"

**Category**: Negative  
**Priority**: P2  
**Preconditions**: Logged-in user  
**Steps**:

1. Navigate to `/bookings/999999`
   **Expected Results**: EmptyState shown: "Booking not found" with description "This booking doesn't exist or may have been cancelled."  
   **Business Rule**: 404 from API → booking not found UI (no 403, no empty booking data)  
   **Suggested Layer**: E2E

---

## Edge Cases (TC-400 – TC-499)

### TC-400: Book the exact last available seat

**Category**: Edge Case  
**Priority**: P0  
**Preconditions**: Event with exactly 1 personal available seat  
**Steps**:

1. Book with quantity=1 on that event
   **Expected Results**: Booking succeeds; subsequent visit shows event as sold out for that user; `+` button disabled  
   **Business Rule**: personalAvailable = max(0, event.availableSeats - userBooked); booking succeeds when personalAvailable ≥ quantity  
   **Suggested Layer**: E2E

---

### TC-401: Creating 10th booking when 9 exist triggers FIFO — correct booking is pruned

**Category**: Edge Case  
**Priority**: P0  
**Preconditions**: User has 9 bookings (events A×3, B×3, C×3); oldest overall booking is on event A  
**Steps**:

1. Create a 10th booking for event D
   **Expected Results**: Oldest booking from a different event (oldest on A, B, or C, excluding D) is pruned first; new D booking exists; total = 9  
   **Business Rule**: findOldestUserBookingExcludingEvent(userId, eventId) is called first before fallback  
   **Suggested Layer**: API

---

### TC-402: Multiple bookings for same event accumulate seat deductions

**Category**: Edge Case  
**Priority**: P1  
**Preconditions**: Event with 20 totalSeats; user creates booking1 for 3 tickets, then booking2 for 4 tickets on same event  
**Steps**:

1. Create booking1 (qty=3)
2. Create booking2 (qty=4)
3. Check available seats for that event
   **Expected Results**: personalAvailable = 20 − 3 − 4 = 13 for this user  
   **Business Rule**: getBookedQuantitiesForEvents aggregates all of the user's bookings on an event  
   **Suggested Layer**: API

---

### TC-403: Bookings list with exactly 10 bookings shows no pagination

**Category**: Edge Case  
**Priority**: P2  
**Preconditions**: User has exactly 10 bookings  
**Steps**:

1. Navigate to `/bookings`
   **Expected Results**: All 10 bookings shown on page 1; Pagination component not rendered (totalPages = 1)  
   **Business Rule**: Pagination only renders when totalPages > 1  
   **Suggested Layer**: E2E

---

### TC-404: Bookings list with 11 bookings shows pagination

**Category**: Edge Case  
**Priority**: P2  
**Preconditions**: User has 11 bookings (possible via direct API seeding)  
**Steps**:

1. Navigate to `/bookings`
   **Expected Results**: Page 1 shows 10 bookings; Pagination component visible; page 2 shows remaining 1 booking  
   **Business Rule**: limit=10 default; totalPages = Math.ceil(total/limit)  
   **Suggested Layer**: API

---

### TC-405: Clear all bookings when list is already empty

**Category**: Edge Case  
**Priority**: P3  
**Preconditions**: Logged-in user with 0 bookings  
**Steps**:

1. Navigate to `/bookings` (empty state visible)
2. Click **Clear all bookings**, confirm dialog
   **Expected Results**: API returns `{ deleted: 0 }`; empty state remains; no error thrown  
   **Business Rule**: deleteAllForUser with no matching records returns count=0  
   **Suggested Layer**: API

---

### TC-406: Phone number with formatting chars is accepted (10 digits after stripping)

**Category**: Edge Case  
**Priority**: P2  
**Preconditions**: Logged-in user on event detail page  
**Steps**:

1. Enter "+91 98765 43210" in Phone field (11 digits total, 10 when stripped of non-digits may vary — test "+1 234 567 8901")
2. Submit valid form
   **Expected Results**: Validation passes if stripped digits ≥ 10; booking created  
   **Business Rule**: customerPhone.replace(/\D/g, '').length < 10  
   **Suggested Layer**: E2E

---

### TC-407: Booking reference format is always PREFIX-6CHARS

**Category**: Edge Case  
**Priority**: P1  
**Preconditions**: User creates 5 bookings across different events  
**Steps**:

1. Create bookings for events starting with letters A, B, C, D, E
2. Check each bookingRef in confirmation
   **Expected Results**: Each ref matches pattern `^[A-Z]-[A-Z0-9]{6}$`; prefix = first char of respective event title  
   **Business Rule**: `randomRef`: prefix + '-' + 6 chars from ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789  
   **Suggested Layer**: API

---

### TC-408: Cancelling booking from detail page redirects to bookings list

**Category**: Edge Case  
**Priority**: P2  
**Preconditions**: Logged-in user on `/bookings/:id` for a confirmed booking  
**Steps**:

1. Click **Cancel Booking**, confirm dialog
   **Expected Results**: On success, router.push('/bookings') fires; user lands on `/bookings` list  
   **Business Rule**: onSuccess callback calls router.push('/bookings')  
   **Suggested Layer**: E2E

---

### TC-409: Same-event FIFO fallback burns a seat permanently

**Category**: Edge Case  
**Priority**: P0  
**Preconditions**: User has 9 bookings all on event "X"; event X has 50 totalSeats; each booking qty=1  
**Steps**:

1. Create a 10th booking for event X (qty=1)
   **Expected Results**: Oldest booking on X is deleted; NEW booking created; `eventRepository.decrementSeats` reduces X's `availableSeats` by quantity (seat permanently burned); a different user's seat count is also reduced  
   **Business Rule**: sameEventFallback = true → decrementSeats called → availableSeats permanently reduced  
   **Suggested Layer**: API

---

## UI State (TC-500 – TC-599)

### TC-500: Empty state displayed when user has no bookings

**Category**: UI State  
**Priority**: P1  
**Preconditions**: Logged-in user with 0 bookings  
**Steps**:

1. Navigate to `/bookings`
   **Expected Results**: SVG ticket icon; heading "No bookings yet"; subtext about browsing events; "Browse Events" button linking to `/events`  
   **Business Rule**: bookings.length === 0 → EmptyState rendered  
   **Suggested Layer**: E2E

---

### TC-501: Loading skeleton cards shown while bookings are fetching

**Category**: UI State  
**Priority**: P2  
**Preconditions**: Logged-in user; slow network or intercepted request  
**Steps**:

1. Navigate to `/bookings` before data returns
   **Expected Results**: 5 BookingCardSkeleton placeholders displayed; no actual booking data visible yet  
   **Business Rule**: isLoading = true → skeleton array(5) rendered  
   **Suggested Layer**: E2E

---

### TC-502: Error state with retry button shown on API failure

**Category**: UI State  
**Priority**: P1  
**Preconditions**: API returns 500 on GET /bookings  
**Steps**:

1. Navigate to `/bookings`
   **Expected Results**: EmptyState: "Couldn't load bookings", "Failed to connect to the server. Please try again.", Retry button visible  
   **Business Rule**: isError = true → error EmptyState with retry action  
   **Suggested Layer**: E2E

---

### TC-503: Retry button re-fetches bookings after error

**Category**: UI State  
**Priority**: P2  
**Preconditions**: Bookings page in error state; API recovers  
**Steps**:

1. Click **Retry** button
   **Expected Results**: Loading state shown; bookings list renders correctly on success  
   **Business Rule**: `action={<Button onClick={() => refetch()}>Retry</Button>}`  
   **Suggested Layer**: E2E

---

### TC-504: Clear all confirmation dialog appears before deletion

**Category**: UI State  
**Priority**: P1  
**Preconditions**: Logged-in user with bookings  
**Steps**:

1. Click **Clear all bookings**
   **Expected Results**: Browser `confirm()` dialog appears with "Clear all your bookings? This cannot be undone."; cancelling the dialog does NOT delete bookings  
   **Business Rule**: `if (!confirm(...)) return;` prevents deletion without confirmation  
   **Suggested Layer**: E2E

---

### TC-505: Cancel booking confirmation dialog is shown before deletion

**Category**: UI State  
**Priority**: P0  
**Preconditions**: On booking detail page for a confirmed booking  
**Steps**:

1. Click **Cancel Booking**
   **Expected Results**: ConfirmDialog modal opens: "Cancel this booking?"; description includes bookingRef and quantity; **Yes, cancel it** and close buttons visible  
   **Business Rule**: `setConfirm(true)` opens ConfirmDialog; booking only cancelled on confirm  
   **Suggested Layer**: E2E

---

### TC-506: Dismissing cancel confirm dialog leaves booking intact

**Category**: UI State  
**Priority**: P1  
**Preconditions**: On booking detail page; ConfirmDialog is open  
**Steps**:

1. Click close (×) or outside the dialog
   **Expected Results**: Dialog closes; booking still shows "confirmed" status; Cancel Booking button still visible  
   **Business Rule**: `onClose={() => setConfirm(false)}` — no mutation called  
   **Suggested Layer**: E2E

---

### TC-507: Sold-out event shows SOLD OUT badge in seat availability meta

**Category**: UI State  
**Priority**: P1  
**Preconditions**: Logged-in user; event with 0 availableSeats  
**Steps**:

1. Navigate to the event detail page
   **Expected Results**: Seat availability meta shows "SOLD OUT" in red; Confirm Booking button shows "Sold Out" and is disabled  
   **Business Rule**: `availableSeats === 0 ? 'SOLD OUT'` with `text-red-600 font-bold`  
   **Suggested Layer**: E2E

---

### TC-508: Low seats (≤10) shows amber warning in seat meta

**Category**: UI State  
**Priority**: P2  
**Preconditions**: Event with exactly 7 available seats  
**Steps**:

1. Navigate to event detail page
   **Expected Results**: "7 / N seats" shown in amber/orange color (`text-amber-600 font-semibold`)  
   **Business Rule**: `availableSeats <= 10 ? 'text-amber-600'`  
   **Suggested Layer**: E2E

---

### TC-509: Refund check shows loading spinner for ~4 seconds

**Category**: UI State  
**Priority**: P1  
**Preconditions**: On booking detail page; refund status = idle  
**Steps**:

1. Click **Check eligibility for refund?**
   **Expected Results**: Spinner with text "Checking your refund eligibility…" appears immediately (data-testid="refund-spinner"); link disappears; after ~4s result shows (data-testid="refund-result")  
   **Business Rule**: `setStatus('checking')` then `setTimeout(() => setStatus(...), 4000)`  
   **Suggested Layer**: E2E

---

### TC-510: Admin bookings page — filter by confirmed status

**Category**: UI State  
**Priority**: P2  
**Preconditions**: Logged-in user on `/admin/bookings` with a mix of booking statuses  
**Steps**:

1. Select "Confirmed" from the status dropdown
   **Expected Results**: Table filters to show only confirmed bookings; status badges all show "confirmed" (green); page resets to 1; Cancel button shown per row  
   **Business Rule**: status filter passed to useBookings hook; Cancel button rendered only for `b.status === 'confirmed'`  
   **Suggested Layer**: E2E
