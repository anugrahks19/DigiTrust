# DigiTrust-AVP Address Validation Platform 🛡️

**A hackathon-ready address validation system** combining DigiTrust-AVP scoring protocol, DHRUVAx real-world evidence aggregation, and SVA (Swarm Validation Architecture) concepts.

## 🎯 Overview

This platform validates addresses using multi-layer evidence scoring and issues blockchain-ready validation tokens. Perfect for KYC, e-commerce, government services, and financial inclusion.

### Key Features

- **📊 Address Confidence Score (ACS)**: 0-100 score based on 6 evidence components
- **🏅 Validation Levels**: VL0 (Unverified) to VL3 (High Confidence)
- **🔐 Signed Tokens**: JWT tokens with QR codes for verified addresses
- **🌍 DIGIPIN Integration**: Geographic cell-based addressing
- **👥 Human-in-the-Loop**: Postman/community verification option
- **📈 Admin Dashboard**: Review queue, KPIs, confirmation workflow
- **💎 Premium UI**: Glassmorphism effects, smooth animations, dark mode

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+** for backend
- **Modern browser** for frontend
- **Live Server** or any static file server for frontend

### Installation

#### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Initialize database and start server
python main.py
```

Backend will run at `http://localhost:8000`

#### 2. Frontend Setup

```bash
cd frontend

# Option 1: Using Python's built-in server
python -m http.server 3000

# Option 2: Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"

# Option 3: Using Node.js http-server
npx http-server -p 3000
```

Frontend will run at `http://localhost:3000`

### 3. Open Application

Navigate to `http://localhost:3000` in your browser.

## 📖 Usage Guide

### For Users

1. **Enter Address**: Fill in the form or use "Pick from Map" to select a DIGIPIN
2. **Quick Demo**: Click demo address cards for pre-filled examples
3. **Accept Consent**: Check the consent box (purpose: KYC, validity: 365 days)
4. **Submit**: Click "Validate Address"
5. **View Result**: See your ACS score, VL badge, evidence breakdown, and suggestions
6. **Download Token**: For ACS ≥ 65, download signed JWT token with QR code

### For Admins

1. **Switch to Admin View**: Click "Admin" in navigation
2. **View KPIs**: Total validations, pending reviews, average ACS
3. **Review Queue**: See all validation requests
4. **Review Details**: Click "Review" on any request
5. **Confirm**: Toggle "Postman Confirmed" to boost score, or override VL manually
6. **Update**: Click "Confirm & Update" to save changes

## 🎨 Technology Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: ORM with SQLite database
- **Pydantic**: Data validation
- **PyJWT**: Token signing
- **Pandas**: CSV data processing

### Frontend
- **Vanilla JavaScript**: No framework, pure JS modules
- **Leaflet.js**: Interactive maps
- **Chart.js**: Evidence visualizations
- **QRCode.js**: Token QR generation
- **Axios**: HTTP client

### Design
- **CSS Custom Properties**: Theming system
- **Glassmorphism**: Frosted glass effects
- **HSL Color Palette**: Vibrant gradients
- **Google Fonts**: Inter & Outfit
- **Keyframe Animations**: Smooth transitions

## 📊 Scoring Engine

### ACS Formula

```
ACS = 0.30 × GeoScore 
    + 0.20 × TemporalScore 
    + 0.15 × IoTScore 
    + 0.20 × DocScore 
    + 0.10 × CrowdScore 
    + 0.05 × HistoryScore
```

### Evidence Components

| Component | Weight | Data Source | Score Range |
|-----------|--------|-------------|-------------|
| **Geographic** | 30% | DIGIPIN grid match | 0-100 |
| **Temporal** | 20% | Delivery history | 0-100 |
| **IoT** | 15% | Device pings | 0-100 |
| **Documentary** | 20% | Property tax/KYC | 0-100 |
| **Crowd** | 10% | Community validation | 0-100 |
| **History** | 5% | Prior validations | 0-100 |

### Validation Levels

- **VL3** (85-100): High confidence, instant token issuance
- **VL2** (65-84): Medium confidence, token eligible
- **VL1** (40-64): Low confidence, needs verification
- **VL0** (0-39): Unverified, requires human review

## 🗂️ Project Structure

```
address-validation-platform/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── database.py             # SQLAlchemy models
│   ├── models.py               # Pydantic schemas
│   ├── scoring_engine.py       # ACS calculation logic
│   ├── evidence_aggregator.py  # DHRUVAx layer
│   ├── token_service.py        # JWT token service
│   ├── routers/
│   │   ├── validation.py       # User API endpoints
│   │   └── admin.py            # Admin API endpoints
│   ├── data/
│   │   ├── mock_digipin_grid.csv
│   │   ├── mock_delivery_logs.csv
│   │   └── mock_iot_pings.csv
│   └── requirements.txt
│
└── frontend/
    ├── index.html
    ├── css/
    │   └── style.css           # Premium design system
    └── js/
        ├── app.js              # Core app logic
        ├── components/
        │   ├── mapPicker.js
        │   ├── addressForm.js
        │   └── validationResult.js
        └── views/
            ├── history.js
            └── adminDashboard.js
```

## 🔌 API Endpoints

### User Endpoints

- `POST /api/validate` - Submit address for validation
- `GET /api/result/{request_id}` - Get validation result
- `GET /api/token/{request_id}` - Download validation token
- `GET /api/history/{user_id}` - Get user's validation history

### Admin Endpoints

- `GET /api/admin/dashboard` - KPI metrics
- `GET /api/admin/queue` - Validation queue
- `GET /api/admin/review/{request_id}` - Detailed review
- `POST /api/admin/confirm` - Confirm/override validation
- `POST /api/admin/revoke/{token_id}` - Revoke token

## 🎭 Demo Script (3 Minutes)

### Intro (20s)
> "India's addresses are complex. We built a system that validates them using AI + real-world evidence, giving a 0-100 confidence score and issuing signed tokens."

### Live Demo: High Score (40s)
1. Click "High Score Urban" demo card
2. Shows address in Thrissur with good DIGIPIN
3. Submit → ACS: **92**, VL3
4. Show evidence breakdown (geo: 95, delivery: 100, IoT: 100)
5. Download token → QR code appears

### Failure Case (40s)
1. Click "Low Score Rural" demo card
2. New construction, no signals
3. Submit → ACS: **28**, VL0
4. Show suggestions: "Request postman verification"
5. Switch to Admin view

### Admin Confirmation (30s)
1. Queue shows the low-score request
2. Click "Review"
3. Toggle "Postman Confirmed"
4. Submit → ACS jumps to **85**, VL3
5. Token now available

### Phase-2 Slide (30s)
> "Next: SVA layer—citizens earn micro-rewards for validation, creating a living address verification economy."

### Closing (20s)
> "This solves last-mile addressing for 1.4 billion people. Accuracy, inclusivity, privacy—all in one system."

## 🔐 Security & Privacy

- ✅ **Consent Management**: Stored with every validation
- ✅ **Data Minimization**: PII is hashed
- ✅ **Audit Trail**: Immutable logs for all actions
- ✅ **Token Signing**: JWT with expiry and verification
- ✅ **No Raw Exposure**: Only aggregated scores shown

## 🎯 Hackathon Judging Points

1. **"How is it different from Google Maps?"**
   - We don't just verify coordinates—we produce a **measurable confidence score** that systems can programmatically use for risk assessment.

2. **"What if there's no digital signal in rural areas?"**
   - We fall back to **human verification** (postman/panchayat) and reward them via SVA phase-2.

3. **"Is this scalable?"**
   - Mock data now, but architecture supports real integrations: DIGIPIN API, India Post, telecom pings, Aadhaar KYC.

4. **"How does Phase-2 SVA work?"**
   - Citizens upload "living proofs" weekly (sensor data + ultrasonic beacons), earn tokens for validation work—creating a **validation economy**.

## 📝 License

MIT License - Free to use for hackathons and projects

## 👥 Team

Built for the hackathon showcasing DigiTrust-AVP + DHRUVAx + SVA integration

---

**Made with ❤️ using modern web technologies**
