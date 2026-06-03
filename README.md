# 🎓 PocketUni: The Ultimate Student Financial Companion

**Live App:** [https://poket-uni.vercel.app](https://poket-uni.vercel.app)

PocketUni is a high-performance web and mobile application designed to eliminate the "end-of-month broke" crisis for university students. By combining a **Dynamic Safe Spend Engine** with **AI-powered financial coaching** and **Campus Discovery**, PocketUni ensures you never have to guess if you can afford that extra coffee.

---

## 🚀 Key Features

### 1. 📊 The "Safe Spend" Engine
Unlike regular trackers that just show your balance, PocketUni tells you exactly how much you can spend **today**.
*   **Auto-Adjusting:** If you overspend on Monday, the app automatically recalculates and reduces your budget for Tuesday to keep you on track.
*   **Visual Indicators:** Color-coded spend bars show your health (Green = Safe, Red = Over budget).

### 2. 🤖 BudgetBot AI (Llama 3.1 Power)
Integrated with NVIDIA's high-speed inference, our AI doesn't just give generic advice.
*   **Context Aware:** It knows your balance, your recent expenses, and your savings goals.
*   **Personalized Coaching:** Ask "Can I afford a 500-rupee dinner?" and it will check your remaining days and give a data-backed "Yes" or "No."

### 3. 📍 Campus Discovery & Vendor Guide
Stop wandering! Find the best value-for-money spots around your university.
*   **Budget Matching:** The app highlights vendors that fit within your current daily "Safe Spend."
*   **Integrated Maps:** Get one-tap Google Maps directions to any mess, stationery shop, or clinic.

### 4. 📱 Hybrid Mobile Experience
*   **PWA Support:** Install it directly from your browser to your home screen.
*   **Android Ready:** Full Capacitor integration for native APK deployment.
*   **Glassmorphism UI:** A sleek, dark-themed interface designed for the modern student aesthetic.

---

## 📖 User Manual (Getting Started)

### Step 1: Initial Setup
When you first open the app, go to **Settings** (Gear icon):
1.  **Total Monthly Income:** Enter your total allowance or salary.
2.  **Saving Goal:** Set aside a percentage for emergencies.
3.  **Fixed Costs:** Enter your monthly rent, Wi-Fi bill, or gym membership.
4.  **Date Range:** Select your monthly cycle (e.g., from the 1st to the 30th).

### Step 2: Tracking Your Life
On the **Home** tab, use the **"+"** button frequently:
*   Log every expense, no matter how small.
*   The **Calendar Ledger** view helps you see exactly which days were "expensive" so you can spot habits.

### Step 3: Finding Food & Essentials
Navigate to the **Campus** tab:
*   Filter by **Food**, **Stationery**, or **Medical**.
*   Check the **Average Price** to ensure it aligns with your budget.
*   Click **Get Directions** to open Google Maps instantly.

### Step 4: Chatting with BudgetBot
Go to the **Chat** tab:
*   Use Quick Prompts like "Am I on track?"
*   Ask specific questions: "How much did I spend on food this week?"
*   Get tips: "How can I save 10% more next month?"

---

## 🛡️ Admin & Security Guide
PocketUni includes a protected **Admin Panel** (`/admin`) for campus leaders.
*   **Default Password:** `admin123`
*   **Functions:** Add new vendors, update prices, or change location URLs.
*   **Persistence:** All changes are synced instantly to the Supabase cloud database for all users.

---

## 🛠️ Technical Stack & Setup

### Requirements
*   Node.js 18+
*   Supabase Account (Free Tier)
*   NVIDIA NIM API Key (Free Tier)

### Local Development
1.  Clone the repo: `git clone <repo-url>`
2.  Install dependencies: `npm install`
3.  Start dev server: `npm run dev`
4.  Build for production: `npm run build`

### Environment Variables
Configure these in your Supabase dashboard and `AiChat.tsx`:
*   `NVIDIA_API_KEY`: Your AI model key.
*   `projectId` / `publicAnonKey`: Your Supabase connection strings.

---
**PocketUni** — *Built to help students spend smarter and live better.*
