# FitJourney - Your Personalized Fitness Companion

![FitJourney Hero](https://placehold.co/1200/400.png?text=FitJourney)
*(A screenshot of the application's home page)*

**(You can see the website at https://fit-journey-chi.vercel.app)**

FitJourney is a modern, full-stack web application designed to connect users with personalized fitness plans. It empowers members to discover workouts, track their progress in detail, and stay motivated, while providing trainers with a dedicated platform to create, manage, and share their expertise with the community.

## ✨ Key Features

### For Members
-   **Explore Plans**: Browse a rich library of fitness plans created by expert trainers.
-   **Advanced Filtering**: Find the perfect plan by filtering based on goals, duration, price, age, BMI, and rating.
-   **AI Plan Generator**: Get a unique, personalized workout plan generated by AI based on your profile, goals, and available equipment.
-   **Detailed Progress Tracking**:
    -   Mark off daily plan completion with an interactive checklist.
    -   Log detailed metrics for each exercise (weight, reps, sets, duration).
    -   Visualize progress with charts for volume, time, and personal bests.
-   **Personalized Dashboard**: View plan summaries, track workout streaks, and see your entire activity history.
-   **Save & Review**: Favorite plans for later and leave ratings & reviews to help the community.
-   **Real-time Chat**: Connect and chat directly with trainers to ask questions and get support.
-   **Secure Payments**: Easily purchase plans using the Razorpay payment gateway.

### For Trainers
-   **Dedicated Dashboard**: A central hub to manage all your fitness plans.
-   **Earnings Dashboard**: Track your total revenue and view a detailed list of every plan sale.
-   **Plan Creation & Management**: An intuitive form to build detailed, day-by-day workout plans.
-   **AI-Assisted Plan Modification**: Use AI to suggest changes to existing plans (e.g., "make this harder" or "adapt for no equipment").
-   **Publishing Control**: Keep plans as drafts or publish them to make them available to all members.
-   **Profile Management**: Build your trainer profile with a bio, specializations, and avatar.

## 🛠️ Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI**: [React](https://reactjs.org/), [Shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication, Firestore, Storage)
-   **Payments**: [Razorpay](https://razorpay.com/)
-   **Generative AI**: [Google AI & Genkit](https://firebase.google.com/docs/genkit)
-   **Image Management**: [Cloudinary](https://cloudinary.com/)
-   **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) for validation
-   **State Management**: React Context & Hooks

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

-   Node.js (v18 or later recommended)
-   A Google Firebase account
-   A Cloudinary account
-   A Razorpay account

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <project-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    -   Create a new project in the [Firebase Console](https://console.firebase.google.com/).
    -   Add a "Web" app to your project.
    -   Copy the Firebase config object and paste it into `src/lib/firebase.ts`.
    -   Enable **Authentication** (Email/Password provider).
    -   Enable **Firestore** in Test Mode for now (you should add security rules for production).
    -   Enable **Storage**.

4.  **Set up Cloudinary & Razorpay:**
    -   Get your Cloud Name, API Key, and API Secret from your Cloudinary dashboard.
    -   Get your Key ID and Key Secret from your Razorpay dashboard (Test mode is recommended for development).

5.  **Environment Variables:**
    -   Create a `.env.local` file in the root of the project.
    -   Add your Firebase, Cloudinary, and Razorpay credentials. You will also need to enable Google AI services in the Google Cloud console for your Firebase project.

    ```plaintext
    # Cloudinary Credentials
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret

    # Razorpay Credentials
    NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
    RAZORPAY_KEY_SECRET=your_razorpay_key_secret

    # Google AI (Genkit) Credentials - obtained from Google Cloud
    GEMINI_API_KEY=your_google_ai_api_key
    ```

6.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application should now be running at `http://localhost:9002`.

### Firestore Indexes

This project uses complex queries that require composite indexes in Firestore. The application will log errors to the console with a direct link to create any missing indexes when a query fails. Be sure to create these indexes in your Firebase project for features like "Highest Rated Plans" and "Featured Reviews" to work correctly.

## 📜 Available Scripts

-   `npm run dev`: Starts the Next.js development server.
-   `npm run genkit:dev`: Starts the Genkit development server (for AI flows).
-   `npm run build`: Builds the application for production.
-   `npm run start`: Starts a production server.
-   `npm run lint`: Runs ESLint for code analysis.
