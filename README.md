# 📋 JP-KR-Schedule-Bridge

An AI-powered collaboration assistant that synchronizes Korean and Japanese business schedules, identifies potential communication gaps due to different holidays, and automates professional bilingual mail drafting using Gemini AI

## 🎯 Background & Motivation
- **The Context**
  - Working in a Korea-Japan cross-border environment requires constant checking of two different holiday systems to avoid scheduling conflicts and communication delays

- **The Problem**
  1. Scheduling Blind Spots: Missing a Japanese "Golden Week" or Korean "Chuseok" often leads to urgent requests being ignored or project timelines being pushed back unexpectedly

  2. Communication Barriers: Drafting formal, urgent, or apologetic business emails in Japanese (Keigo) is mentally taxing and time-consuming for non-native engineers

  3. Performance & UX: Many existing calendar tools are heavy and slow, failing to provide the instant "at-a-glance" status needed in fast-paced IT environments

- **The Solution**
  1. Dual-Sync Visualization: A side-by-side calendar view that instantly highlights holiday conflicts and recommends the best collaboration days

  2. AI Business Agent: Integrated Gemini to generate context-aware business drafts (Formal/Urgent/Apology) based on specific calendar events

  3. Optimization: Fast first paint through static generation with daily regeneration, and stable hydration of date-dependent UI

- **Data Source**: Google Calendar API (KR/JP), User Input (LocalStorage), Gemini AI Analysis

- **Key Features**
  1. Dual Calendar View: Synchronized display of KR/JP holidays

  2. Smart Business Advice: Real-time status analysis (e.g., "Today is a holiday in JP, expect delays")

  3. One-Click AI Mailer: Contextual email drafting with 3 distinct tones, shown beside a translation in the UI language (Japanese mail from the Korean UI, Korean mail from the Japanese UI)

  4. User Event Management: Add/Delete personal meetings with persistent storage

  5. Empty State Onboarding: Minimalist UI guide for first-time users

- **JP-KR-Schedule-Bridge Architecture (Mermaid)**
```mermaid
graph TD
    User(["User"])
    NextJS["Next.js App (Client/Server)"]
    HolidayAPI["Google Calendar API<br/>(KR/JP Holidays)"]
    Gemini{{"Gemini API <br/>(Contextual Drafting)"}}
    Storage[("LocalStorage<br/>(User Events)")]
    Vercel["Vercel"]

    User -->|Interaction| NextJS
    NextJS -->|Fetch Holidays| HolidayAPI
    NextJS <-->|Persist Events| Storage
    NextJS -->|Request Analysis| Gemini
    
    subgraph "Performance Core"
        ISR["ISR (Incremental Static Regeneration)"]
        Hydration["Hydration Shield<br/>(Error #418 Fix)"]
    end
    
    NextJS --- ISR
    NextJS --- Hydration
    Vercel --- NextJS
```

## 🛠 Tech Stack
- **Framework**: <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"> (App Router)
- **Language**: <img src="https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
- **Styling**: <img src="https://img.shields.io/badge/tailwindcss-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white">
- **AI/LLM**: ![Google Gemini](https://img.shields.io/badge/google%20gemini-8E75B2?style=for-the-badge&logo=google%20gemini&logoColor=white) | API
- **Deployment**: <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white"> | CI/CD Pipeline
- **Libraries**: <img src="https://img.shields.io/badge/datefns-770C56?style=for-the-badge&logo=datefns&logoColor=white"> | Date
- **Testing**: <img src="https://img.shields.io/badge/vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white"> | Date & Validation Logic <img src="https://img.shields.io/badge/playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white"> | Browser Tests
- **CI**: <img src="https://img.shields.io/badge/github%20actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white"> | Type Check, Lint, Unit & Browser Tests, Build

## 🚀 Getting Started
1. Create `.env.local` with `GOOGLE_CALENDAR_API_KEY` and `GEMINI_API_KEY`
2. Run `npm install`, then `npm run dev`
3. Run `npm test` for the unit tests and `npm run lint` for static checks
4. Run `npm run test:e2e` for the browser tests. They build the app against a local holiday fixture server and mock AI responses, so no API keys or Gemini quota are needed. The fixtures contain 2026 holidays, which the app requests while the current year is between 2025 and 2027.

## ⚠️ Known Limitations
- `/analyze` limits requests per client (10/min) and per server instance (60/min) in memory, so limits are best-effort across serverless instances
- Calendars cover the previous, current, and next year only
- When Gemini models are busy, falling back to the next model can make email generation take up to about 75 seconds
- AI drafts can still contain wording mistakes, so review them before sending

## ✅ Milestone
- **Phase 1**: Foundation & Frontend Environment Setup
  - [x] Phase 1-1: Initialize GitHub Repository & Project Board
  - [x] Phase 1-2: Setup Next.js (App Router) & TypeScript Development Environment
  - [x] Phase 1-3: Configure Global Styling Strategy (Tailwind CSS & Business Theme)
  - [x] Phase 1-4: Security Setup (Environment Variables & .env Configuration)

- **Phase 2**: Holiday Data Acquisition & Modeling
  - [x] Phase 2-1: Research & Integrate Public Holiday APIs (KR/JP)
  - [x] Phase 2-2: Define TypeScript Interfaces for Holiday & Schedule Models
  - [x] Phase 2-3: Develop Data Fetching Utilities with Error Handling
  - [x] Phase 2-4: Implement Local Caching Logic for Performance Optimization

- **Phase 3**: Core Business & Comparison Logic
  - [x] Phase 3-1: Develop "Cross-Border Holiday Comparison" Engine
  - [x] Phase 3-2: Implement Long-term Vacation Detection (Golden Week, Chuseok, etc.)
  - [x] Phase 3-3: Build Context-Aware Alert Logic (Business Risk Assessment)
  - [x] Phase 3-4: Create Scheduling Recommendation Algorithm

- **Phase 4**: Advanced Web Interface & UX Development
  - [x] Phase 4-1: Build Interactive Dual-Calendar Dashboard UI
  - [x] Phase 4-2: Implement Real-time Schedule Conflict Visualization
  - [x] Phase 4-3: Develop Business Email Template Generator (KR/JP Bilingual)
  - [x] Phase 4-4: Implement Dynamic Calendar Navigation
  - [x] Phase 4-5: User-Defined Schedule Management & Data Persistence
  - [x] Phase 4-6: Integrate Gemini AI for Smart Email Generation
  - [x] Phase 4-7: Ensure Responsive Web Design for Cross-Device Support

- **Phase 5**: Deployment, Documentation & Portfolio Finalization
  - [x] Phase 5-1: Cloud Deployment & CI/CD Pipeline Setup (Vercel)
  - [x] Phase 5-2: Performance Optimization (Server-side Rendering & Static Generation)
  - [x] Phase 5-3: Comprehensive Technical Documentation (README)
  - [x] Phase 5-4: Global Localization & UX Optimization 
  - [x] Phase 5-5: Code Refactoring & TypeScript Strict Mode Audit
  - [x] Phase 5-6: Final Project Retrospective
  - [x] Phase 5-7: Add CI Pipeline & Browser Tests (GitHub Actions, Playwright)

## 🔥 Troubleshooting & Lessons Learned
**1. Hydration Mismatch (React Error #418)**
  - **Challenge**: Server-side rendering of dynamic dates caused a mismatch with client-side local time.

  - **Resolution**: Read the current date and saved events through `useSyncExternalStore`, so they stay empty on the server and during hydration and are applied right after, ensuring UI stability.

**2. API Resilience & AI Rate Limiting (429 Too Many Requests)**
  - **Challenge**: Frequent testing during development hit Gemini's free tier quotas.

  - **Resolution**: Switched to gemini-flash-latest for faster response times and implemented defensive error handling to notify users when quotas are reached.

  - **Follow-up**: During a Gemini demand spike the primary model returned 503 errors or stopped responding, so each model now has a 25-second limit and requests fall back to the next model.

**3. Accessibility & Contrast**
  - **Challenge**: Minimalist design with light grays (text-gray-400) failed WCAG accessibility standards.

  - **Resolution**: Conducted a comprehensive color audit, darkening low-contrast text and buttons to reach a Lighthouse Accessibility score of 100 without sacrificing the professional design.

## 📈 Results
Measured on the live site with Lighthouse 12.8 on November 6, 2026, after the final release. Performance varies between runs.

| | Performance | Accessibility | Best Practices | SEO | FCP | LCP |
|---|---|---|---|---|---|---|
| **Desktop** | 100 | 100 | 100 | 100 | 0.3s | 0.5s |
| **Mobile** | 92 | 100 | 100 | 100 | 1.4s | 2.0s |

An axe scan (WCAG 2.1 A/AA rules) of the main screens, the email draft, and the event dialog found no violations. Automated checks cover only part of WCAG.

## 🧐 Self-Reflection
- **Technical Growth**
  - **System Design**: Mastered the process of building "Production-ready" applications by implementing environment variable-based configuration management and sophisticated error masking, ensuring a high-security and deployment-ready architecture.

  - **Global Mindset**: Gained a deep understanding of global-targeted software architecture by designing the codebase with multi-language support and localization in mind from the very early stages of development.

- **Problem-Solving Mindset**
  - **Bridge Builder**: Confirmed that the true value of software lies in its role as a "bridge" that resolves real-world pain points. By automating personal inconveniences, I realized how such solutions can provide meaningful value to a wider community.

## 🧐 Final Project Retrospective

### 💡Engineering for Reliability
This project was built with a core focus on 'Reliability'. On desktop, the live site scores 100 in all four Lighthouse categories; on mobile, it scores 100 in Accessibility, Best Practices, and SEO, and 92 in Performance. Beyond mere feature implementation, I worked to keep AI features usable in professional business environments through production-level optimization, model fallback, and robust error handling.

- **Lighthouse Score (Desktop)**: ![Lighthouse Score](https://img.shields.io/badge/Lighthouse-Performance_100%20|%20Access_100%20|%20Best_100%20|%20SEO_100-brightgreen?style=for-the-badge)

### 🚀 Technical Evolution: Beyond CRUD
Moving from Project 2 (Python/Streamlit) to Project 3 (Next.js/TypeScript), I mastered the nuances of Modern Web Architecture. Dealing with Hydration errors and SSR/ISR taught me how to manage the lifecycle of data in a high-performance production environment.

### 🌏 Bridging Markets
As an aspiring IT solution engineer for the Japanese market, this tool represents my ability to identify cultural friction points and solve them using cutting-edge technology. It is not just a calendar, it is a communication bridge.

## ✨ Contact
- **Live Demo**: https://jp-kr-schedule-bridge.vercel.app

- **GitHub Repository**: https://github.com/2daKaizen-gun/jp-kr-schedule-bridge

- **Email**: hkys1223@gmail.com