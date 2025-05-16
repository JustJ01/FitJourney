
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors">
      <Dumbbell className="h-8 w-8" />
      <span className="text-2xl font-bold tracking-tight">{APP_NAME}</span>
    </Link>
  );
};

export default Logo;
