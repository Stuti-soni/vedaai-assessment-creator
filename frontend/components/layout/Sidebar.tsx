'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Wrench, Library, Settings } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/', label: 'My Groups', icon: BookOpen },
  { href: '/', label: 'Assignments', icon: BookOpen },
  { href: '/', label: "AI Teacher's Toolkit", icon: Wrench },
  { href: '/', label: 'My Library', icon: Library },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 py-6 px-4">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">V</span>
        </div>
        <span className="font-bold text-lg text-gray-900">VedaAI</span>
      </div>

      <Link
        href="/assignments/new"
        className="flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-medium mb-6 hover:bg-gray-700 transition-colors"
      >
        + Create Assignment
      </Link>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.label === 'Assignments' && pathname === '/';
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-orange-50 text-orange-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-200">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
          <Settings size={16} />
          Settings
        </Link>
        <div className="flex items-center gap-3 px-3 py-2 mt-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-medium text-orange-700">
            DP
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Delhi Public School</p>
            <p className="text-xs text-gray-500">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
