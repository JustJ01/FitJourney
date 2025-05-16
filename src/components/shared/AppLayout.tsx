
import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
