
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'; 
import { GeistMono } from 'geist/font/mono'; 
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext'; 
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/shared/AppLayout'; 
import { APP_NAME } from '@/lib/constants';

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
