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

# Configure Environment
# Copy the example env file and add your API keys (Required for Social Login)
cp .env.example .env

# ⚠️ CRITICAL: OAuth Callback Configuration

## For Local Development (What you are doing now)
You must search for "Callback URL" or "Redirects" in your Developer Dashboard.

**GitHub**:
*   GitHub only allows **ONE** callback URL.
*   Set it to: `http://localhost:8000/api/auth/callback/github`
*   *(When you go live/production, you will need to change this to the Vercel/Render URL)*

**Discord**:
*   Discord allows multiple redirects. Add BOTH:
    1. `http://localhost:8000/api/auth/callback/discord`
    2. `https://digitrust1.onrender.com/api/auth/callback/discord`

## For Production (When using Vercel/Render)
- Switch the GitHub URL to: `https://digitrust1.onrender.com/api/auth/callback/github`
- Ensure the Discord production URL is in the list.

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

## ☁️ Deployment

Ready to go live? Check out our step-by-step **[Deployment Guide](./DEPLOYMENT.md)** for hosting on Render (Backend) and Vercel (Frontend).

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

## 🏆 Accuracy & Validation

We don't just claim accuracy; we **measure it**.

- **Current Status**: 4-Dimensional verification framework (ACS, VL, Position, Fraud).
- **Optimization**: Automated weight tuning has already improved MAE by 30%.
- **Roadmap**: Clear path to **95%+ accuracy** via real-world data integration (India Post, Telecom logs).

👉 **[Read the Full Accuracy Report](./ACCURACY_REPORT.md)** for detailed metrics, testing methodology, and our improvement strategy.


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


## 🏗️ Production Readiness & Scalability

While this demo uses SQLite and local file inputs, the architecture is designed for scale:

### 1. Database Scaling
- **Migration Path**: `SQLite` → `PostgreSQL` (AWS RDS/Aurora)
- **Caching**: `Redis` cluster for caching frequent DIGIPIN lookups and evidence scores (TTL 24h)
- **Data Partitioning**: Sharding based on Postal Zones (e.g., separate DB shards for North/South zones)

### 2. High Availability
- **Backend**: Stateless FastAPI containers orchestrated via Kubernetes (K8s)
- **Load Balancing**: NGINX ingress controller handling SSL termination and rate limiting
- **Async Processing**: Celery workers + RabbitMQ for offloading heavy evidence aggregation tasks

### 3. Real-World Integration
- **Hybrid Data Fetching**: System currently demonstrates "Hybrid" mode - falling back to mock grid data but querying live government APIs (e.g., OGD PIN API) when available.

## 🔐 Security & Privacy

- ✅ **Consent Management**: Stored with every validation
- ✅ **Data Minimization**: PII is hashed
- ✅ **Audit Trail**: Immutable logs for all actions
- ✅ **Token Signing**: JWT with expiry and verification
- ✅ **Encryption**: PII is hashed; sensitive columns (Address) are **AES-256 encrypted at rest** in production.
- ✅ **Secure Transport**: All API communication via **TLS 1.3**
- ✅ **No Raw Exposure**: Only aggregated scores shown

## 👥 Team

Built for the hackathon showcasing DigiTrust-AVP + DHRUVAx + SVA integration.

---

**Made with ❤️ using modern web technologies**
