
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; // Corrected import for GeistSans
import { GeistMono } from 'geist/font/mono'; // Corrected import for GeistMono
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext'; // Import ThemeProvider
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/shared/AppLayout'; // Import the new AppLayout
import { APP_NAME } from '@/lib/constants';

// Using GeistSans.variable and GeistMono.variable as per Next/Font documentation for CSS variables
const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: `Your personalized fitness journey companion. Explore plans, generate AI-powered workouts, and connect with trainers.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppLayout> {/* Use AppLayout to wrap children */}
              {children}
            </AppLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
