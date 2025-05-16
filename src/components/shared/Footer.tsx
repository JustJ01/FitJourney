
import { APP_NAME } from '@/lib/constants';

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        <p className="mt-1">Crafted for your fitness journey.</p>
      </div>
    </footer>
  );
};

export default Footer;
