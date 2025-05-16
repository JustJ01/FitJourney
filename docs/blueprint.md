# **App Name**: FitJourney

## Core Features:

- Plan Explorer: Users (primarily members) can browse and filter actual fitness plans stored in the database. Filtering options include: age range, BMI category, rating, price, and duration, not just UI placeholder logic. Each plan is connected to a trainer, and includes metadata like goals and target audience.
- Plan Details: Clicking on a plan shows a detailed page with: Plan name, description, duration, goal, and rating. A list of exercises for each day, pulled from exercises table. Trainer information (name, bio). All data is fetched in real time.
- Trainer Dashboard: Only authenticated users with the trainer role can access the dashboard. Trainers can: Create, update, and delete their own fitness plans. Add, edit, or remove exercises linked to a plan. View an overview of all plans they’ve created. Backend is powered by tables (plans, exercises), with Row-Level Security (RLS) ensuring trainers can only modify their own content.
- AI Plan Generator: Members can generate a personalized fitness plan using an integrated LLM as a tool. Input: age, fitness goal, BMI, and experience level. Output: a structured plan with goal, duration, and sample exercises. Trainers can save the generated plan directly into their dashboard for reuse or modification. Backend integration ensures AI-generated plans can be persisted in plans and exercises tables.

## Style Guidelines:

- Primary color: A vibrant cyan (#42C2F5), suggestive of health, activity, and forward progress.
- Background color: Light grayish-blue (#E0F7FA), providing a clean and calming backdrop.
- Accent color: A saturated blue-violet (#776BE5), to provide contrast and visual interest, especially in key action areas.
- Clean, modern, sans-serif fonts to ensure readability.
- Use clear and modern icons related to fitness activities.
- Clean and intuitive grid layout, with clear visual hierarchy.
- Subtle transitions and animations for feedback.