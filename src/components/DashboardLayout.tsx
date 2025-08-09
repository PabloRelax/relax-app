// src/components/DashboardLayout.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
<Link href="/dashboard">Dashboard</Link>
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase/client';
import { Dialog } from '@headlessui/react';
import { Cog6ToothIcon, UserCircleIcon, UsersIcon as GroupIcon } from '@heroicons/react/24/outline';
import {
  CalendarDaysIcon,
  BuildingOffice2Icon,
  PowerIcon,
  UsersIcon,
  HandRaisedIcon,
  CheckCircleIcon,
  GiftIcon,
  CursorArrowRippleIcon
} from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  const [wasClicked, setWasClicked] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const justOpenedRef = useRef(false);

  const navItems = [
    {
      name: 'Operations',
      href: '/operations',
      icon: CursorArrowRippleIcon,
    },
    {
      name: 'Multiview',
      href: '/multiview',
      icon: CalendarDaysIcon,
    },
    {
      name: 'Properties',
      href: '/properties',
      icon: BuildingOffice2Icon,
    },
    {
      name: 'Tasks',
      href: '/tasks',
      icon: CheckCircleIcon,
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
        setWasClicked(false);
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      }
    }

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel (Sidebar) */}
      <aside className="w-16 bg-gray-900 text-white shadow-lg flex flex-col justify-between items-center py-4">
        <div>
          <nav>
            <ul className="space-y-8 mt-10">
              {navItems.map((item) => (
                <li key={item.name} className="flex justify-center">
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
          <div
            ref={profileRef}
            className="relative mb-4"
            onMouseEnter={() => {
              if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
                closeTimeoutRef.current = null;
              }
              justOpenedRef.current = true;
              setProfileOpen(true);
            }}
            onMouseLeave={() => {
              if (!wasClicked) {
                closeTimeoutRef.current = setTimeout(() => {
                  setProfileOpen(false);
                }, 500);
              }
            }}
          >
          <button
            onClick={() => {
              if (justOpenedRef.current) {
                justOpenedRef.current = false;
                return;
              }
              setProfileOpen((prev) => !prev);
              setWasClicked((prev) => !prev);
            }}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <span className="text-white font-semibold">PR</span>
          </button>

          {profileOpen && (
            <div className="absolute left-12 bottom-0 mb-1 z-50 bg-white text-gray-800 rounded-lg shadow-lg w-52 p-3 space-y-2">
              <div className="border-b pb-2">
                <p className="font-semibold text-sm">Pablo Relax</p>
                <p className="text-xs text-gray-500">pablo@example.com</p>
              </div>
              <Link href="/users" className="flex items-center gap-2 text-sm w-full hover:text-blue-600">
                <UsersIcon className="h-4 w-4" />
                Manage Users
              </Link>
              <Link href="/settings" className="flex items-center gap-2 text-sm w-full hover:text-blue-600">
                <Cog6ToothIcon className="h-4 w-4" />
                Settings
              </Link>
              <Link href="/refer" className="flex items-center gap-2 text-sm w-full hover:text-blue-600">
                <GiftIcon className="h-4 w-4" />
                Refer a friend
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm text-red-600 hover:underline"
              >
                <PowerIcon className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} className="fixed inset-0 z-50 flex justify-end items-start bg-black bg-opacity-20 p-4">
        <Dialog.Panel className="bg-white rounded-lg shadow-lg p-6 w-72 mt-16">
          <div className="flex items-center mb-4 space-x-3">
            <UserCircleIcon className="h-10 w-10 text-gray-600" />
            <div>
              <p className="font-medium text-gray-800">Pablo Relax</p>
              <p className="text-sm text-gray-500">pablo@example.com</p>
            </div>
          </div>

          <ul className="space-y-3 text-sm">
            <li>
              <Link href="/users" onClick={() => setSettingsOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                <GroupIcon className="h-5 w-5" />
                Manage People
              </Link>
            </li>
            <li>
              <Link href="/settings" onClick={() => setSettingsOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                <Cog6ToothIcon className="h-5 w-5" />
                Settings
              </Link>
            </li>
            <li>
              <Link href="/refer" onClick={() => setSettingsOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors">
                <HandRaisedIcon className="h-5 w-5" />
                Refer a friend
              </Link>
            </li>
            <li>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors w-full"
              >
                <PowerIcon className="h-5 w-5" />
                Log out
              </button>
            </li>
          </ul>
        </Dialog.Panel>
      </Dialog>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>
    </div>    
  );
}