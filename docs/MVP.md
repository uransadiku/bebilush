# Minimum Viable Product (MVP) Scope - Bebilush

## Goal
Launch a high-value, "wow" factor web application that attracts Albanian mothers and validates the demand for personalized AI services and digital products.

## In Scope (Phase 1)

### 1. Landing Page (The "Hook")
-   **Hero Section:** Emotional, high-quality visuals, clear value prop in Albanian.
-   **Feature Highlights:** Showcase the Name Generator and Personalized Services.
-   **Trust Signals:** Testimonials (can be placeholders for now), "About Us" mission.

### 2. AI Tool: "Gjeni Emrin e Bebit" (Baby Name Finder)
-   **Functionality:**
    -   Simple form: Gender, First Letter (optional), Style (Modern, Traditional).
    -   **AI Action:** Calls Gemini API to suggest 5-10 names with meanings.
-   **Value:** Instant, culturally relevant utility.

### 3. Digital Shop (Showcase)
-   **Content:**
    -   1-2 Sample eBooks (e.g., "Udhëzues për Nënat e Reja në Gjermani" - Guide for New Moms in Germany).
    -   1 Free Checklist (Downloadable PDF).
-   **Functionality:** Product display, "Buy" button (can link to Stripe payment link or simple checkout).

### 4. Personalized Service Teaser
-   **Service:** "Kënga e Emrit" (Name Song) or "Përralla e Personalizuar" (Personalized Fairy Tale).
-   **UI:** A beautiful form to input baby details.
-   **Action:** Collects lead/payment inquiry. (Full automation not required for MVP, can be "concierge MVP").

## Out of Scope (Phase 1)
-   Full Community/Forum (Bebilush Chat) - *Just a link/waitlist*.
-   Mobile App (React Native).
-   Complex User Accounts/Auth (unless needed for saving favorites).
-   Automated Video Generation (Veo) - *Too complex for MVP, manual or later*.

## Tech Stack
-   **Framework:** Next.js 14+ (App Router).
-   **Styling:** Vanilla CSS (CSS Modules) with a custom Design System.
-   **AI:** Google Gemini API.
-   **Database:** Postgres (via Prisma) for storing leads/orders (optional for strict MVP, but good for "Waitlist").
