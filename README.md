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
         │  Operator Control Console │                    │   Campaign & Frame Studio │
         │ • Engagement Telemetry    │                    │ • Upload Transparent PNG  │
         │ • Security Passcode Lock  │                    │ • Set 4:5, 1:1, 9:16 Res  │
         │ • High-Res QR Generator   │                    │ • Auto-Indexed Mongo Slugs│
         └─────────────┬─────────────┘                    └─────────────┬─────────────┘
                       │                                                │
                       └───────────────────────┬────────────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │     MONGODB ATLAS CLOUD DB       │
                              │ • Campaigns & Event Metadata     │
                              │ • Live Telemetry & Event Stream  │
                              └────────────────┬─────────────────┘
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
         │   Tactile Camera View     │                    │    Instant HD Compositing │
         │ • Pan / Drag / Move       │                    │ • HTML5 Canvas rendering  │
         │ • Pinch / Rotary Dial Zoom│                    │ • Studio Color Grading    │
         │ • Rotate 90° & Flip       │                    │ • Full 1080p+ HD Export   │
         │ • 100% In-Browser Privacy │                    │ • Audio Shutter Feedback  │
         └───────────────────────────┘                    └───────────────────────────┘
```

---

## 📁 Project Structure

```
Branded Photo frame tool/
├── package.json              # Root monorepo script runner
├── README.md                 # Architecture & setup documentation
├── .gitignore                # Protects secrets & node_modules
│
├── client/                   # Frontend Web Application (Vite + React + Framer Motion)
│   ├── index.html            # Google Fonts & SEO meta
│   ├── vite.config.js        # Proxy configuration (/api -> backend)
│   ├── package.json          # React 19, Framer Motion, Lucide Icons, QR Code
│   └── src/
│       ├── main.jsx          # DOM root mount
│       ├── App.jsx           # App state, MongoDB cloud loader & routing
│       ├── index.css         # Skeuomorphic design system (chassis, dials, LEDs)
│       ├── components/
│       │   ├── Navbar.jsx              # Mode switch, audio toggle & operator lock
│       │   ├── CanvasEditor.jsx        # Virtual Leica camera viewfinder & controls
│       │   ├── AdminDashboard.jsx      # Telemetry gauges & frame channel rack
│       │   ├── ConsoleAuthModal.jsx    # Numeric tactile passcode lockbox
│       │   ├── CreateCampaignModal.jsx # Campaign deployment studio
│       │   └── QRCodeModal.jsx         # High-res optical QR badge print preview
│       └── utils/
│           ├── frameRenderer.js        # High-res canvas compositing & color grading
│           └── soundEffects.js         # Zero-latency Web Audio physical synthesizer
│
└── server/                   # Backend REST API (Node.js + Express + Mongoose)
    ├── .env                  # MongoDB Atlas connection & security config
    ├── .env.example          # Environment template for production deployments
    ├── package.json          # Express, Mongoose, Multer, Dotenv
    ├── uploads/              # Storage directory for custom PNG frames
    └── src/
        ├── index.js          # REST endpoints, static production file server
        ├── database.js       # Production MongoDB Atlas connection & auto-seeding
        └── models/
            ├── Campaign.js   # Mongoose Campaign schema & validation
            └── Analytics.js  # Mongoose Telemetry schema & atomic counters
```

---

## 🍃 MongoDB Atlas Configuration

The application is fully connected to **MongoDB Atlas**. Configuration is managed in `server/.env`:

```env
PORT=5001
NODE_ENV=production

# MongoDB Atlas Cluster Connection
MONGODB_URI=mongodb+srv://lyhengdev_db_user:t6cjUYSZ6xkjXN7J@cluster0.kgxsvma.mongodb.net/branded_photo_frame?retryWrites=true&w=majority

# Operator Security Credentials
ADMIN_USER=admin
ADMIN_PASSCODE=2026
```

---

## 🚀 Running the Project

### Development Mode
```bash
# Run both frontend and backend concurrently
npm run dev

# Or separately:
npm run dev:server   # Starts Express backend on port 5001
npm run dev:client   # Starts Vite React frontend on port 3001
```

### Production Deployment
The application is pre-configured to build into a standalone production service. The Express backend serves the optimized client bundle:

```bash
# 1. Build the production frontend bundle
npm run build

# 2. Start the production fullstack server
npm start
```

Access the application in production at:
- **Full App**: `http://localhost:5001/`
- **API Health Check**: `http://localhost:5001/api/health`

---

## 🔐 Operator Security Credentials

To access the **Operator Control Console**:
- **Username**: `admin` *(or `operator`)*
- **Passcode**: `2026` *(or `frame2026`)*
