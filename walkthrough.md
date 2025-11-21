# Bebilush MVP - Walkthrough

I have successfully built the **Bebilush MVP**, a premium web application for Albanian mothers. The app features a high-end design, an AI-powered baby name generator, and a digital shop showcase.

## Key Features Implemented

### 1. Landing Page (The Hook)
-   **Hero Section:** A visually striking introduction with a soft, premium color palette (Bronze, Sand, Cream) and "glassmorphism" effects.
-   **Call to Actions:** Clear buttons to "Gjeni Emrin" (Find Name) and "Dyqani" (Shop).

### 2. AI Baby Name Generator (`/emrat`)
-   **Functionality:** Users can select gender, style (Modern, Traditional, Illyrian, etc.), and an optional starting letter.
-   **AI Integration:** Connected to **Google Gemini** to generate culturally accurate names with meanings and origins.
-   **UI:** A beautiful form with a clean results display.

### 3. Digital Shop (`/dyqani`)
-   **Showcase:** A grid of mock digital products (eBooks, Templates, Personalized Songs).
-   **Design:** Product cards with category tags and "Buy" buttons.

## Tech Stack & Design
-   **Framework:** Next.js 14+ (App Router).
-   **Styling:** Vanilla CSS (CSS Modules) with a robust Design System (Variables for colors, typography, spacing).
-   **Icons:** Lucide React for a modern, clean look.
-   **AI:** Google Generative AI SDK (Gemini 1.5 Flash).

## How to Run
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Configure Environment:**
    Create a `.env.local` file in the root and add your API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```
3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
4.  **Open Browser:**
    Visit `http://localhost:3000`.

## Verification Results
-   **Build:** Passed (`npm run build` success).
-   **Linting:** Passed.
-   **Responsiveness:** Components are designed to be mobile-friendly (using Flexbox/Grid and media queries).
