// src/components/DashboardLayout.tsx
'use client';

import Link from 'next/link';
{/* @ts-expect-error Deno doesn't recognize Next.js's Link as a JSX component */}
<Link href="/dashboard">Dashboard</Link>
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../types/supabase.ts';
import {
  HomeIcon,
  BuildingOffice2Icon,
  PowerIcon,
  UsersIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';



const supabase = createClientComponentClient<Database>();

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
    },
    {
      name: 'Properties',
      href: '/properties',
      icon: BuildingOffice2Icon,
    },
    {
      name: 'Clients',
      href: '/clients',
      icon: UsersIcon,
    },
    {
      name: 'Cleaners',
      href: '/cleaners',
      icon: HandRaisedIcon,
    },
  ];


  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Panel (Sidebar) */}
      <aside className="w-25 bg-gray-900 text-white shadow-lg p-4 flex flex-col justify-between">
        <div>
          <nav>
            <ul className="space-y-8 mt-10">
              {navItems.map((item) => (
                <li key={item.name} className="flex justify-center">
                  {/* @ts-ignore Deno doesn't recognize next/link as a JSX component */}
                  <Link
                    href={item.href}
                    className="group relative text-blue-600 hover:text-blue-400 transition-colors"
                  >
                    <item.icon className="h-9 w-9" aria-hidden="true" strokeWidth={2} />
                    <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-700 text-white text-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {item.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Sign Out Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSignOut}
            className="relative group text-blue-600 hover:text-blue-400 transition-colors"
          >
            <PowerIcon className="h-6 w-6" aria-hidden="true" />
            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-700 text-white text-sm rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {children} {/* This is where your dashboard page content will go */}
      </main>
    </div>
  );
}