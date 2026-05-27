'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Library, Wrench } from 'lucide-react';

const items = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/', label: 'Assignments', icon: BookOpen },
  { href: '/', label: 'Library', icon: Library },
  { href: '/', label: 'AI Tools', icon: Wrench },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-4 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.label === 'Assignments' && pathname === '/';
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-xs transition-colors ${
                active ? 'text-orange-500' : 'text-gray-500'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
