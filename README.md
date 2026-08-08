# RetailMind AI – Company Brain for Smart Retail

RetailMind AI is a smart retail management suite consisting of a customer-facing Flutter mobile app and a React web dashboard. The two apps are synchronized in real-time. Unstructured text messages from customers are parsed automatically using OpenAI's GPT models to identify catalog products, check stock levels, calculate taxes (GST 18%), raise restock alerts, suggest catalog alternatives, and compile ReportLab PDF invoices.

---

## Workspace Structure

```
.
├── backend/            # Python FastAPI Backend
│   ├── services/       # AI parsing, PDF generation, & Firestore listeners
│   ├── main.py         # Entrypoint & API Controllers
│   ├── mock_db.py      # Seed data & in-memory fallback database
│   └── requirements.txt
├── web/                # React.js Vite Frontend (Admin Web Dashboard)
│   ├── src/pages/      # Dashboard panels (Orders, Inventory, BI Chat, etc.)
│   └── src/firebase.js # Firebase Client config
└── mobile/             # Flutter Customer Mobile App
    └── lib/            # Multi-screen application & service layers
```

---

## Out-of-the-Box Mock Mode

Both the frontend React dashboard and the Flutter mobile client contain an automatic **Mock Fallback Mode**. If you do not have Firebase credentials or an OpenAI API key configured, the system will run locally using REST API polling, regex text heuristics, and in-memory mock storage.

---

## 1. Backend Setup & Run

The Python FastAPI backend manages AI text extraction, checks inventory levels, generates PDF invoices, and processes BI chatbot commands.

### Prerequisites
*   Python 3.10+ installed

### Step-by-Step Installation
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Linux / macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables:
   Create a `.env` file (copied from `.env.template`):
   ```env
   PORT=8000
   USE_MOCK_SERVICES=true # Set to false once Firebase & OpenAI keys are added
   OPENAI_API_KEY=your-openai-api-key
   FIREBASE_CREDENTIALS=firebase-service-account.json
   ```
5. Start the server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *The backend documentation will be accessible at http://localhost:8000/docs*

---

## 2. Web Admin Dashboard Setup & Run

Vite + React.js + Tailwind CSS. Displays live metrics, charts, incoming order notifications, and the conversational AI chat interface.

### Prerequisites
*   Node.js v18+ & npm installed

### Step-by-Step Installation
1. Navigate to the web folder:
   ```bash
   cd web
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The web client will be active at http://localhost:5173*

---

## 3. Customer Mobile App Setup & Run

Flutter simulation app that lets customers place structured cart orders or type free-form text requests representing different communication channels (WhatsApp, Instagram, etc.).

### Prerequisites
*   Flutter SDK (3.20+) & Dart SDK installed
*   Android Emulator / iOS Simulator running or physical device connected

### Step-by-Step Installation
1. Navigate to the mobile folder:
   ```bash
   cd mobile
   ```
2. Install Flutter packages:
   ```bash
   flutter pub get
   ```
3. Start the application:
   ```bash
   flutter run
   ```

---

## Cloud Configuration Details

To transition from Mock Mode to production cloud databases:

### 1. Firebase Firestore Setup
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** and create a database named `(default)` in Test Mode.
3. Enable **Firebase Authentication** and turn on the **Email/Password** provider.
4. **Service Account for Backend**: Go to Project Settings -> Service Accounts -> Click **Generate New Private Key**. Save the JSON file inside `backend/` as `firebase-service-account.json`. Update `.env` to set `USE_MOCK_SERVICES=false`.
5. **Web Configurations**: Add a Web App in the Firebase console. Copy the config object and replace the credentials in [firebase.js](file:///e:/Study/New%20folder/web/src/firebase.js) under the `firebaseConfig` object.

### 2. OpenAI API Setup
1. Get an API key from the [OpenAI Platform](https://platform.openai.com/).
2. Add your key to `backend/.env` under the `OPENAI_API_KEY` parameter.
