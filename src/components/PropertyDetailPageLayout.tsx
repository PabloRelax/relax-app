'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import type { PropertyWithClient } from '../types/supabase.ts';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../types/supabase.ts';

interface PropertyDetailPageLayoutProps {
  children: React.ReactNode;
  propertyId: number;
  property: PropertyWithClient;  // Add this line
  navigationItems: {
    name: string;
    href: string;
    icon: React.ReactNode;
    current: boolean;
  }[];
}

export default function PropertyDetailPageLayout({ 
  children,  
  propertyId,
  property,   // Add this line
  navigationItems  
}: PropertyDetailPageLayoutProps) {
  const pathname = usePathname();
  const supabase = createClientComponentClient<Database>();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PropertyWithClient[]>([]);
  const router = useRouter();

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*, clients(display_name)')
      .or(
        `short_address.ilike.%${term}%,client_property_nickname.ilike.%${term}%`
      );

    if (error) {
      console.error('Search error:', error.message);
      return;
    }

    const filtered = (data as PropertyWithClient[]).filter((p) =>
      [
        p.short_address,
        p.client_property_nickname,
        p.clients?.display_name,
      ]
        .filter(Boolean)
        .some((field) =>
          field!.toLowerCase().includes(term.toLowerCase())
        )
    );

    setSearchResults(filtered);

  };


  if (!propertyId) return <p className="p-8 text-red-600">Property ID is missing.</p>

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Compact Sidebar (replaces the wide one) */}
      <aside className="w-60 bg-white shadow-lg flex flex-col items-center py-4 border-r border-gray-200">
        {/* Back to Properties */}
        {/* @ts-ignore Deno doesn't recognize next/link as a JSX component */}
        <Link 
          href="/properties"
          className="group relative p-2 mb-4 text-gray-500 hover:text-gray-700"
          title="Back to Properties"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
            Back to Properties
          </span>
        </Link>

        <div className="w-full px-2 mb-4">
          <input
            type="text"
            placeholder="Search properties..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              setSearchTerm(value);
              handleSearch(value);
            }}
          />
        </div>

        {searchResults.length > 0 && (
          <ul className="w-full px-2 max-h-60 overflow-y-auto text-sm mb-4">
            {searchResults.map((result) => (
              <li key={result.id}>
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/properties/${result.id}/calendar`);
                    setSearchTerm('');
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                >
                  {result.clients?.display_name ? result.clients.display_name + ' – ' : ''}
                  {result.short_address}
                  {result.client_property_nickname ? ' – ' + result.client_property_nickname : ''}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Property Info */}
        <div className="text-xs text-center mb-4 w-full px-2">
          <p className="font-bold text-blue-700 truncate">{property.short_address}</p>
          {property.client_property_nickname && (
            <p className="text-gray-600 truncate">{property.client_property_nickname}</p>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 w-full">
          <ul className="space-y-2 mt-10">
            {navigationItems.map((item) => (
              <li key={item.name} className="flex justify-center">
                {/* @ts-ignore Deno doesn't recognize next/link as a JSX component */}
                <Link
                  href={item.href}
                  className={`group relative p-2 rounded-lg transition-colors duration-200 ${
                    pathname === item.href
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title={item.name}
                >
                  {item.icon}
                  <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {item.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area (unchanged) */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  )
}
