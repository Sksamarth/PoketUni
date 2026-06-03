# 📑 PocketUni - Comprehensive Project Documentation

## 1. Project Overview
PocketUni is a full-stack web and mobile application designed to solve the "end-of-month broke" crisis for university students. It combines financial tracking with local campus knowledge to provide a contextual budgeting experience.

---

## 2. System Architecture

### 2.1 Frontend (The User Interface)
*   **Framework:** React 18 with TypeScript for type-safe code.
*   **Styling:** Tailwind CSS for a modern, "glassmorphism" dark-themed UI.
*   **Routing:** React Router 7 handles page navigation without reloads.
*   **State Management:** LocalStorage for immediate persistence and Supabase for cloud-synced vendor data.

### 2.2 Backend & Infrastructure
*   **Database:** Supabase (PostgreSQL) stores the vendor list in a specialized JSONB table (`kv_store_75fee4df`).
*   **AI Integration:** Connects to NVIDIA NIM API endpoints to process Llama 3 models.
*   **Hosting:** Configured for Vercel/Netlify with custom rewrite rules for API proxying and SPA routing.

---

## 3. Core Modules Deep-Dive

### 3.1 The "Safe Spend" Engine
This is the heart of the app. It doesn't just subtract expenses from income.
*   **Formula:** `(Total Income - Savings Goal - Fixed Costs - Spent So Far) / Days Remaining in Month`.
*   **Logic:** It dynamically adjusts. If you overspend today, your "Safe Spend" for tomorrow decreases automatically.

### 3.2 AI BudgetBot
*   **Context Injection:** Every time you chat, the app sends a hidden "Context Report" to the AI containing your current balance, recent expenses, and goals.
*   **Model:** Uses `llama-3.1-8b` via NVIDIA's high-speed inference.

### 3.3 Admin & Vendor Management
*   **Security:** Simple password-gate (`admin123`) for administrative tasks.
*   **Dynamic Updates:** Uses Supabase `upsert` logic, meaning changes appear for all users instantly without needing an app update.

---

## 4. Setup & Deployment Guide

### 4.1 Environment Variables
The app requires the following keys (located in `src/app/pages/AiChat.tsx` and `utils/supabase/info.tsx`):
*   `NVIDIA_API_KEY`: For the AI Chatbot.
*   `projectId` & `publicAnonKey`: For Supabase connectivity.

### 4.2 Database Configuration
The following SQL must be run in the Supabase SQL Editor:
```sql
CREATE TABLE kv_store_75fee4df (key TEXT PRIMARY KEY, value JSONB);
ALTER TABLE kv_store_75fee4df ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON kv_store_75fee4df FOR ALL USING (true);
```

### 4.3 Production Build
```bash
npm install   # Install dependencies
npm run build # Generate production files in /dist
```

---

## 5. Deployment Rules (Critical)

### For Vercel (`vercel.json`):
Handles API proxying to avoid CORS errors when talking to AI servers.

### For Netlify (`_redirects`):
Handles SPA routing to prevent 404 errors on page refresh.

---

## 6. Future Roadmap
*   **OCR Scanning:** Scan physical receipts using the phone camera.
*   **Multi-User Groups:** Shared "House Budgets" for roommates.
*   **Bank Integration:** Automated SMS-based expense tracking.

---
**PocketUni Documentation v1.0**
