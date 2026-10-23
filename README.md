# Q-Sync — Smart Queue Management System
> **"Your turn. Without the wait."**

Q-Sync is a complete, production-quality, full-stack web application designed to digitize physical queues and help organizations serve people efficiently. It eliminates corridor congestion, issues digital tokens, provides real-time position tracking without page refreshes, and triggers intelligent 3-stage turn-approach notifications as a customer's turn draws near.

---

## 🚀 Key Highlights & Architectural Differentiators

1. **Strict Concurrency-Safe Queue Order**:
   - Atomic sequence allocation and row-level locks (`SELECT ... FOR UPDATE SKIP LOCKED`).
   - Prevents duplicate token numbers and ensures that two controllers never call the same patient simultaneously.
   - Genuine FIFO queue order with emergency/senior/accessible priority weighting (not simplistic token number arithmetic).

2. **3-Stage Smart Turn-Approach Notification System**:
   - **Stage 1 (Two Patients Ahead)**: *"Q-Sync: Your turn is approaching. Only 2 patients are ahead of you. Please get ready."*
   - **Stage 2 (Next in Line)**: *"Q-Sync: You are next in line. Please return to the waiting area or approach the designated counter."*
   - **Stage 3 (Token Called)**: *"Q-Sync: Token OPD-025 is now called! Please proceed immediately to Counter 1 (Dr. Ananya Sharma)."*
   - Native Web Audio dual-tone airport chime + Web Speech API vocal room announcement + haptic vibration + optional email alerts via Resend.

3. **High-Velocity Queue Controller Console**:
   - Single-click **"Complete & Call Next"** workflow for receptionists, triage nurses, and doctors.
   - Repeat **Recall** chime, **Skip / No-Show** with mandatory audit reasons, **Transfer** to secondary department, and **Manual Priority Override**.

4. **Public Waiting-Room Hall Display**:
   - Fullscreen TV display with high contrast, dark navy/slate aesthetic, current serving token callout, counter-by-counter grid, and audio chime with vocal announcement.
   - Displays a dynamic QR code for waiting-room visitors to scan with their phones to join the queue or track their ticket.

5. **Self-Service Touchscreen Kiosk Terminal**:
   - Large touch-friendly service buttons, quick priority selection (Standard, Senior, Accessible), instant ticket issuance, and printable ticket layout.

6. **Receptionist QR Ticket Scanner & In-Person Check-In**:
   - Integrated camera barcode scanner (`html5-qrcode`) or reference code lookup to verify physical arrival and prevent fraud.

7. **Deep Operational Analytics & Audit Trail**:
   - Hourly peak arrival charts, department workload distributions, status breakdown, and one-click CSV report export.
   - Comprehensive audit trail of every call, skip, complete, and override action.

8. **Queue Health & Congestion Intelligence**:
   - Automatic congestion warnings (Low, Moderate, Busy, Congested) with smart counter opening recommendations.

---

## 🛠️ Technology Stack

- **Framework**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Database & RLS**: PostgreSQL schema & Supabase migrations (`supabase/migrations/`)
- **Real-Time Engine**: Cross-tab `BroadcastChannel` synchronization + Supabase Realtime channel integration
- **Audio & Speech**: Web Audio API oscillator chime + Web Speech API SpeechSynthesis
- **Visualization**: Recharts
- **QR Code**: `qrcode` (ticket generation) & `html5-qrcode` (camera scanning)
- **Transactional Email**: Resend integration (`/api/notify`)

---

## 📂 Project Structure

```
q-sync/
├── src/
│   ├── app/
│   │   ├── page.tsx                     # High-impact landing page & product preview
│   │   ├── get-token/page.tsx           # Customer token issuance flow
│   │   ├── track/
│   │   │   ├── page.tsx                 # Token lookup & personal ticket history
│   │   │   └── [ref]/page.tsx           # Real-time live ticket tracker & notification banner
│   │   ├── controller/page.tsx          # Dedicated queue controller dashboard
│   │   ├── display/page.tsx             # Waiting room TV display with chime & vocal speech
│   │   ├── kiosk/page.tsx               # Touchscreen entrance dispensary
│   │   ├── scan/page.tsx                # Staff QR code scanner & check-in terminal
│   │   ├── admin/
│   │   │   ├── page.tsx                 # Admin center & queue health indicators
│   │   │   ├── analytics/page.tsx       # Recharts operational analytics & CSV exporter
│   │   │   └── audit/page.tsx           # Security audit logs & override reasons
│   │   ├── api/
│   │   │   ├── notify/route.ts          # Resend transactional email notification API
│   │   │   └── export/route.ts          # Operational CSV export endpoint
│   │   ├── layout.tsx                   # Global application layout with Suspense boundaries
│   │   └── globals.css                  # Custom animations, theme tokens, high-contrast styles
│   ├── components/
│   │   ├── Navbar.tsx                   # Top navigation, realtime sync badge, audio toggle
│   │   ├── Footer.tsx                   # Enterprise footer & quick role links
│   │   ├── TokenCard.tsx                # Dynamic ticket card with live wait times
│   │   ├── QrCodeDisplay.tsx            # Crisp QR code ticket generator
│   │   ├── LiveNotificationBanner.tsx  # Slide-in turn-approach alert banner
│   │   ├── StatusBadge.tsx              # Standardized status and priority badges
│   │   └── FeedbackForm.tsx             # Post-consultation rating & satisfaction form
│   ├── lib/
│   │   ├── types.ts                     # TypeScript definitions for tokens, services, logs
│   │   ├── data-layer.ts                # Unified data engine with real-time cross-tab broadcast
│   │   ├── wait-time.ts                 # Moving-average wait time algorithm
│   │   ├── audio.ts                     # Airport chime & vocal announcer
│   │   ├── notifications.ts             # 3-Stage notification dispatcher & deduplicator
│   │   ├── seed-data.ts                 # Realistic initial multi-speciality clinic data
│   │   └── supabase/                    # Supabase client & server instances
├── supabase/
│   └── migrations/
│       ├── 20261024000000_qsync_schema.sql  # Normalized PostgreSQL schema, indexes, RLS
│       └── 20261024000001_qsync_rpc.sql     # PostgreSQL RPCs (issue, call_next, complete)
├── tests/
│   └── queue-logic.test.ts              # Unit test suite verifying queue integrity
├── .env.example                         # Environment variables template
└── README.md
```

---

## 🏃 Getting Started (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Automated Test Suite
Verify queue ordering, priority triage, and wait-time estimations:
```bash
npm test
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Navigating the Portals

- **Customer Get Token**: [http://localhost:3000/get-token](http://localhost:3000/get-token)
- **Customer Live Tracker**: [http://localhost:3000/track](http://localhost:3000/track)
- **Queue Controller Desk**: [http://localhost:3000/controller](http://localhost:3000/controller)
- **Public Hall Waiting Display**: [http://localhost:3000/display](http://localhost:3000/display)
- **Touch Kiosk Mode**: [http://localhost:3000/kiosk](http://localhost:3000/kiosk)
- **QR Check-in Scanner**: [http://localhost:3000/scan](http://localhost:3000/scan)
- **Admin Center & Health**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Admin Operational Analytics**: [http://localhost:3000/admin/analytics](http://localhost:3000/admin/analytics)
- **Audit & Override Logs**: [http://localhost:3000/admin/audit](http://localhost:3000/admin/audit)

> **Pro Tip**: Open `/controller` in one browser tab and `/track/QS-E59P7W` or `/display` in a second tab. When you tap **"Complete & Call Next"** in the Controller, the Tracker and Display immediately chime and update their live positions in real time!

---

## 🗄️ Database Setup & Supabase Migrations

If deploying to production with Supabase:
1. Create a new Supabase project at [https://supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Apply `supabase/migrations/20261024000000_qsync_schema.sql` to generate tables, indexes, and RLS policies.
4. Apply `supabase/migrations/20261024000001_qsync_rpc.sql` to create atomic stored procedures (`issue_token`, `call_next_token`, `complete_and_call_next`, etc.).
5. Copy your Project URL and Anon Key into `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## 🔒 Security & Privacy

- **No Public Personal Data**: Hall display and kiosk screens never expose patient phone numbers or personal records.
- **Non-Guessable References**: Public ticket URLs use secure randomized tokens (`QS-XXXXXX`) rather than sequential auto-incrementing IDs to prevent IDOR and enumeration.
- **Privileged Server Secrets**: Privileged API keys (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`) remain strictly on the server and are never bundled into client scripts.
- **Immutable Audit Logging**: Every staff override, call, skip, or transfer records the actor's identity, timestamp, and mandatory clinical justification.

---

## 📄 License
MIT License. Built for hospitals, clinics, banks, and public service organizations worldwide.
