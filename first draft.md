CONTEXT

You are continuing work on an existing prototype web application (already partially built via Builder.io) for an Air Compressor Dealer's internal business management system. This is NOT a fresh build — some modules/screens already exist in the current codebase, others are incomplete or missing entirely.

Your first task is a full audit, your second task is to implement everything that is missing or incorrect, without breaking what's already working.

============================================
STEP 1 — AUDIT (do this before writing any code)
============================================

Go through the entire existing codebase and produce a written checklist comparing what exists vs. what's specified below. For each module and each specific behavior listed in this prompt, mark it as:
- ✅ Implemented correctly
- ⚠️ Partially implemented / implemented incorrectly (explain what's wrong or missing)
- ❌ Not implemented at all

Check specifically for:
- Are all 8 modules present as distinct sections/routes? (Leads, Orders, Service Management, Complaints, Inventory, Payment Ledger, Master Data, Dashboard)
- Are all fields on each form present, with correct required/optional rules?
- Do status-change popups exist and match the specified behavior per status?
- Does the Lead "Win" action correctly create/link a Customer and create an Order, then redirect to it?
- Does the Order detail page have: quotation upload with type selection, approval flag display, timeline (3 latest + view all), notes block, log complaint button?
- Is the quotation approval flag purely visual/non-blocking everywhere, or does it accidentally gate any action?
- Does commissioning correctly initialize a Service Cycle record with Day 0?
- Are the two service cycles (45-day checkup, 2000-hour major service) both present, independently tracked, and does completing the major service also reset the checkup countdown?
- Is the hour-meter reading a real numeric field (not buried inside an uploaded file)?
- Are Pre-Service Report, Post-Service Report, Checkup Report, Technical/Bank/Service Quotations all implemented as simple file uploads (no report-builder/form logic)?
- Does Service Management list view show: last completed service (type + date), both due-date countdowns, and a near-due highlight (within 7 days)?
- Does the Complaints module have both a standalone list and the embedded "Log Complaint" from Orders, and do both feed the same data?
- Does complaint assignment show all engineers plus a "nearby engineers" suggested list (manual pick only, no auto-assignment)?
- Is Inventory simple quantity in/out only, with low-stock alert, no batch/serial tracking?
- Does Payment Ledger support multiple partial entries plus a manual "Mark Complete" override, decoupled from order status progression?
- Are all 6 Masters present (Product, Parts, F.G. Supplier, Employee, Customer, City), and does Customer Master have a "View Orders" link per customer?
- Does Employee Master double as role management (no separate user management module)?
- Is the Dashboard role-specific (different views for Owner, Sales, Receptionist, Service Engineer)?
- Is the reusable Notes component (text + camera/gallery photo + voice note recording) actually reused consistently across Leads, Orders, and elsewhere, or duplicated/inconsistent?
- Is the whole app responsive — genuine mobile layouts, not just a scaled-down desktop view? Check this screen by screen.
- Is seed/sample data present across all modules so the app is demoable end-to-end?

Present this audit as a clear table or list BEFORE touching any code, so I can confirm scope with you.

============================================
STEP 2 — FULL REFERENCE FLOW (for context on how it all connects)
============================================

This is an internal-only tool — 4 roles: Owner, Sales Person, Receptionist, Service Engineer. No client-facing login exists anywhere in this system.

END-TO-END FLOW:

1. Sales visit (Role: Sales Person) → generates a Lead.
2. Lead created (Role: Sales Person) — Company Name, Contact Person Name (optional), Contact Number (required), Salesperson (auto-filled if creator is Sales role, otherwise required dropdown), Address, City (required dropdown, City Master), Status (default "In Process"), Notes block (text + photo + voice note).
3. Lead status behavior:
   - Unavailable → optional reason popup
   - Postponed / Follow-up Needed → optional notes + required date/time picker, schedules a follow-up alert
   - In Process → no popup, default state
   - Lost → mandatory reason popup
   - Disqualified → mandatory reason popup (tracked distinct from Lost)
   - Win → confirmation popup → creates/links Customer record → creates Order pre-filled from lead → redirects to Order detail page. Lead stays visible as "Converted" for history.
4. Technical quotation (Role: Receptionist, uploaded as a file, tagged type = Technical) → Owner approval flag (visual only, never blocks).
5. Financial negotiation (Role: Sales Person + Owner internally, then Sales Person + Client) → happens outside the system, results feed into the Bank Quotation.
6. Order created (from Lead Win, or directly via "Add Order" button) → Order Status (manual dropdown): In Process → Payment Pending → Order Placed with Supplier → Commissioning Pending → Commissioned/Completed.
7. Bank quotation (Role: Receptionist, file upload, type = Bank) → Owner approval flag.
8. Payment logged (Role: Receptionist) → Payment Ledger: multiple partial entries allowed, plus manual "Mark Payment Complete" override — order can progress regardless of ledger completeness.
9. Order placed with F.G. supplier (Role: Owner) → manual action/status update, no deep supplier integration needed.
10. Delivered (Role: Service Engineer assists on-site) → status update.
11. Commissioned (Role: Service Engineer) → this action/date becomes Day 0 for the Service Cycle, which auto-initializes here.

SERVICE CYCLE (two independent, indefinitely-repeating tracks from Day 0):

TRACK A — 45-Day Checkup Cycle (Role: Service Engineer):
- Visit → upload Checkup Report (file upload only) → mark visit "Complete" with date → this restarts the 45-day countdown.
- If issue found → Service Quotation uploaded (file upload, type = Service, Owner approval flag) linked to the order.

TRACK B — 2000-Hour Major Service Cycle (Role: Service Engineer):
- Pre-Service Report uploaded (file) at start.
- Service performed, parts used deducted from Inventory.
- Post-Service Report uploaded (file) at completion.
- Hour-Meter Reading entered as a REAL numeric field (not inside a file) — system calculates next due date from this.
- Marking complete restarts the 2000-hour counter AND resets the 45-day checkup countdown fresh from this date.
- Service Quotation uploaded if parts needed (same pattern as above).

COMPLAINTS (Role: any, primarily Sales/Receptionist log them, Service Engineer resolves):
- Can branch off an order at any point during/after service phase.
- Every complaint is mandatorily linked to an Order.
- Logged via standalone Complaints module OR directly from an Order's "Log Complaint" button — same underlying data.
- Assignment: show all engineers (from Employee Master) + a "nearby engineers" suggested list based on customer location vs. engineer's last known location — Owner or Receptionist manually picks, no auto-assignment.
- Status: Open → Assigned → In Progress → Resolved/Closed → Reopened. Closer's name + timestamp always recorded.

============================================
STEP 3 — FULL MODULE SPEC (source of truth for what "done" looks like)
============================================

MODULE 1: LEADS — as described in steps 2-3 above. Listing page filterable by Status, Salesperson, City.

MODULE 2: ORDERS
- Add Order (direct) or via Lead Win.
- Order Detail Page must include: header/summary, quotation upload section (type selection: Technical/Bank/Service, any file type, approval flag list, view/delete with deletion logged), Timeline (latest 3 + View All, showing status changes with who/when, uploads/deletions, complaints, service activity), Notes block, "Log Complaint" button, auto-trigger of Service Cycle on status = Commissioned.
- Orders in service phase also appear in Service Management module (shared data).

MODULE 3: SERVICE MANAGEMENT
- Lists all commissioned orders with: basic order/customer info, Last Completed Service (type + date, whichever is most recent), two independent due-date countdowns (45-day checkup, 2000-hr major service), near-due highlight within 7 days.
- Both tracks as detailed in Step 2.
- No report-builder — everything is file upload.
- Hour-meter reading is a real field.

MODULE 4: COMPLAINTS — as detailed in Step 2.

MODULE 5: INVENTORY
- Parts only (finished goods/compressors NOT tracked — stays fully with 3rd-party supplier, offline).
- Part name, quantity, low-stock alert threshold, "Add Stock" manual entry, auto-decrement on use in a service visit. No batch/serial/part-number tracking.

MODULE 6: PAYMENT LEDGER
- Linked to Order but non-blocking to order progression.
- Multiple partial entries (date, amount, note) + manual "Mark Payment Complete" toggle.
- Running total: Received vs Order Value.

MODULE 7: MASTER DATA
- Product Master, Parts Master, F.G. Supplier Master, Employee Master (name, role: Owner/Sales/Receptionist/Service Engineer, contact — this is also role/access management, no separate module), Customer Master (auto-created on Lead Win, "View Orders" link per customer → redirects to that order's detail page), City Master (Gujarat cities, prepopulated).

MODULE 8: DASHBOARD (role-specific views)
- Owner: pending quotation approvals, leads needing follow-up, order status breakdown, upcoming service due counts, open complaints, low stock alerts.
- Sales: their assigned leads needing follow-up, recent status changes.
- Receptionist: pending quotation uploads/approvals, orders needing supplier placement, inventory alerts.
- Service Engineer: their upcoming assigned services (checkup/major service due soon), assigned complaints, orders needing hour-meter update.

REUSABLE NOTES COMPONENT: text input + camera/gallery photo attach + voice note recording — must be the SAME component reused across Leads, Orders, and any other place notes appear. Do not duplicate this logic per-module.

============================================
STEP 4 — GLOBAL RULES (apply across all fixes/additions)
============================================
- No client-facing views or logins anywhere.
- Owner-approval flags are visual status badges only — audit carefully that they don't accidentally block any button/action anywhere in the app.
- No quotation-generation or report-generation forms anywhere — Technical Quotation, Bank Quotation, Service Quotation, Checkup Report, Pre-Service Report, Post-Service Report are ALL plain file uploads (any file type: pdf/doc/image).
- Every meaningful action (status change, upload, delete, complaint log, service completion, payment entry) must write a timeline/activity log entry recording action + timestamp + user.
- Full responsiveness — build genuine mobile layouts for every screen you touch, not a shrunk desktop view. Audit existing screens for this specifically, as it's commonly half-done.
- Preserve existing data models/schema where already correctly implemented — don't rebuild working parts, only patch/extend.
- Maintain consistent seed/sample data across all modules so the whole app remains demoable end-to-end after your changes.
- Do not introduce any visual/branding redesign — keep existing styling conventions already established by Builder.io, focus purely on functional completeness.

============================================
STEP 5 — DELIVERABLE
============================================
1. First, give me the audit table (Step 1) and wait for my confirmation before making changes.
2. Once confirmed, implement all ❌ and ⚠️ items, module by module, in this order: Leads → Orders → Service Management → Complaints → Inventory → Payment Ledger → Master Data → Dashboard → Notes component consistency pass → Mobile responsiveness pass.
3. After each module, briefly summarize what was added/fixed before moving to the next, so I can track progress against this spec.