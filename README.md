# FrameCraft — Branded Event Photo Frame Platform

> A lightweight, privacy-first, web-based digital engagement platform for event organizers, brands, conferences, and festivals to create custom photo frames and share them with attendees via single links and QR codes.

---

## 🏗️ System Architecture

```text
                                  ┌──────────────────────────┐
                                  │     ADMIN ORGANIZER      │
                                  └────────────┬─────────────┘
                                               │
                       ┌───────────────────────┴────────────────────────┐
                       ▼                                                ▼
         ┌───────────────────────────┐                    ┌───────────────────────────┐
         │     Admin Dashboard       │                    │   Campaign & Frame Studio │
         │ • Engagement Analytics    │                    │ • Upload Transparent PNG  │
         │ • QR Code Generator       │                    │ • Set 4:5, 1:1, 9:16 Res  │
         │ • Multi-campaign Manager  │                    │ • Instant Slug URL        │
         └───────────────────────────┘                    └───────────────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     ATTENDEE ZERO-SIGNUP URL     │
                              │       eventframe.com/?f=slug     │
                              └────────────────┬─────────────────┘
                                               │
                       ┌───────────────────────┴────────────────────────┐
                       ▼                                                ▼
         ┌───────────────────────────┐                    ┌───────────────────────────┐
         │   Client-Side Photo Edit  │                    │    Instant HD Compositing │
         │ • Pan / Drag / Move       │                    │ • HTML5 Canvas rendering  │
         │ • Pinch / Mouse Zoom      │                    │ • Fixed overlay lock      │
         │ • Rotate 90° & Flip       │                    │ • Full 1080p+ HD Export   │
         │ • 100% In-Browser Privacy │                    │ • Download & Social Share │
         └───────────────────────────┘                    └───────────────────────────┘
```

---

## 📁 Project Structure

```
Branded Photo frame tool/
├── proposal.txt              # Original product proposal and requirements
├── package.json              # Monorepo runner scripts (concurrently)
├── README.md                 # Project architecture & setup documentation
│
├── client/                   # Frontend Web Application (Vite + React)
│   ├── index.html            # App entry point with Google Fonts & SEO meta
│   ├── vite.config.js        # Dev server proxy (/api, /uploads -> backend)
│   ├── package.json          # React, Lucide Icons, QR Code, Confetti
│   └── src/
│       ├── main.jsx          # React DOM root mounting
│       ├── App.jsx           # Main state, view router & modals
│       ├── index.css         # Modern design system (dark glassmorphism)
│       ├── components/
│       │   ├── Navbar.jsx              # Mode switcher (Attendee vs Admin)
│       │   ├── CanvasEditor.jsx        # Touch & mouse photo editor
│       │   ├── AdminDashboard.jsx      # Analytics KPIs & campaign manager
│       │   ├── CreateCampaignModal.jsx # New event setup & PNG upload
│       │   └── QRCodeModal.jsx         # Live QR Code & printable badge
│       └── utils/
│           └── frameRenderer.js        # High-res canvas compositing engine
│
└── server/                   # Backend REST API (Node.js + Express)
    ├── package.json          # Express, Cors, Multer
    ├── uploads/              # Storage directory for custom PNG frames
    ├── data/                 # File-based database (campaigns & analytics)
    │   ├── campaigns.json
    │   └── analytics.json
    └── src/
        ├── index.js          # REST endpoints, static file server
        └── database.js       # Persistent JSON store & analytics counter
```

---

## 🚀 Getting Started

### 1. Install Dependencies
Run from the root directory:
```bash
npm install
npm run build --prefix client
```

### 2. Start Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev
```

Or run them individually:
```bash
# Start backend API (Port 5001)
npm run dev:server

# Start Vite React frontend (Port 3001)
npm run dev:client
```

Open your browser at:
- **Frontend App**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🌟 Key Features

1. **Attendee Photo Experience (Zero Signup)**:
   - Works immediately on mobile or desktop without creating an account or installing apps.
   - Smooth touch gestures: Pinch-to-zoom, drag-to-pan, mouse wheel zooming, rotate 90°, and flip horizontal.
   - Instant export of full-resolution 1080p+ composite images.
   - Web Share API integration for one-tap sharing to Instagram, TikTok, Facebook, and Telegram.

2. **Privacy First (100% In-Browser Rendering)**:
   - Attendee personal photos are composited directly on the client's **HTML5 Canvas**.
   - User photos never touch or store on the backend server, eliminating bandwidth costs and privacy concerns.

3. **Organizer / Admin Portal**:
   - Create campaigns with customized canvas dimensions (4:5 portrait, 1:1 square, 9:16 story, or custom).
   - Upload transparent PNG overlays or use dynamic vector frame presets.
   - Built-in QR Code generator with printable badge format.
   - Real-time audience analytics tracking visits, photo uploads, downloads, and conversion rates.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/campaigns` | List all event campaigns |
| `GET` | `/api/campaigns/:idOrSlug` | Fetch specific campaign details |
| `POST` | `/api/campaigns` | Create new campaign |
| `PUT` | `/api/campaigns/:id` | Update campaign settings |
| `DELETE` | `/api/campaigns/:id` | Delete a campaign |
| `POST` | `/api/upload/frame` | Upload custom transparent PNG overlay |
| `POST` | `/api/campaigns/:id/analytics` | Track event (`visit`, `upload`, `download`) |
| `GET` | `/api/analytics/overview` | Aggregated engagement metrics |
