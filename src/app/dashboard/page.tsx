// src/app/dashboard/page.tsx
'use client'

import type { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database, Tables } from '../../types/supabase.ts'

import DashboardLayout from '../../components/DashboardLayout.tsx';
// IMPORT PropertyDetailPanel HERE
import PropertyDetailPanel from '../../components/PropertyDetailPanel.tsx';

const supabase = createClientComponentClient<Database>()

type PropertyWithClient = Tables<'properties'> & {
  clients: Pick<Tables<'clients'>, 'display_name'> | null;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<PropertyWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  // NEW: State to hold the currently selected property for the detail panel
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithClient | null>(null);
  const router = useRouter()

  useEffect(() => {
    async function loadUserAndProperties() {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/')
        return
      }

      setUser(userData.user)

      let query = supabase
        .from('properties')
        .select('*, clients(display_name)')
        .eq('platform_user_id', userData.user.id)

      if (filter === 'active') {
        query = query.eq('status', 'active');
      }

      const { data: propertiesData, error: propertiesError } = await query;

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        alert('Failed to load properties: ' + propertiesError.message);
      } else {
        const sortedProperties = (propertiesData as PropertyWithClient[]).sort((a, b) => {
            const clientA = a.clients?.display_name || '';
            const clientB = b.clients?.display_name || '';
            return clientA.localeCompare(clientB);
        });
        setProperties(sortedProperties);
      }
      setLoading(false);
    }

    loadUserAndProperties();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };

  }, [router, filter]);

  const filteredProperties = properties.filter(property => {
    const searchContent = `${property.clients?.display_name || ''} ${property.client_property_nickname || ''} ${property.short_address || ''} ${property.status || ''} ${property.city || ''} ${property.suburb || ''}`.toLowerCase();
    return searchContent.includes(searchTerm.toLowerCase());
  });


  if (loading) {
    return <p className="p-8">Loading dashboard layout...</p>;
  }

  if (!user) {
    return <p className="p-8">Redirecting to login...</p>;
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold mb-6">Welcome, {user.email}!</h1>
      <h2 className="text-2xl font-semibold mb-4">Your Properties:</h2>

      {/* Filter Buttons */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded ${filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Show Active
        </button>
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
        >
          Show All
        </button>
      </div>

      {/* Search Input Field */}
      <input
        type="text"
        placeholder="Search properties (e.g., address, client name, status)..."
        className="p-2 border border-gray-300 rounded-md w-full max-w-md mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Property Counter (reflects filtered count) */}
      <p className="text-lg font-medium mb-4">
        Currently displaying {filteredProperties.length} {filter === 'active' ? 'active' : 'total'} properties.
      </p>

      {/* Conditional rendering based on filtered results */}
      {filteredProperties.length === 0 && searchTerm === '' ? (
        <p className="text-gray-600">You haven't added any properties yet. Add one to get started!</p>
      ) : filteredProperties.length === 0 && searchTerm !== '' ? (
        <p className="text-gray-600">No properties found matching {searchTerm}.</p>
      ) : (
        // NEW: Adjust main content width when panel is open
        <div className={`grid gap-6 transition-all duration-300 ${selectedProperty ? 'grid-cols-1 md:grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {filteredProperties.map((property) => (
            // NEW: Make property card clickable
            <div
              key={property.id}
              className="border p-4 rounded-lg shadow-sm bg-white cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedProperty(property)} // Set selected property on click
            >
              <h3 className="text-xl font-bold text-blue-700">
                {/* Client Display Name - always first if available */}
                {property.clients?.display_name && (
                  <span className="font-normal text-gray-800">
                    {property.clients.display_name} - {' '}
                  </span>
                )}
                {/* Always show short_address */}
                {property.short_address}

                {/* Conditionally show property_nickname ONLY if it exists and is different from short_address */}
                {property.client_property_nickname && property.client_property_nickname !== property.short_address && (
                  <span className="font-normal text-gray-800">
                    &nbsp;-&nbsp;{property.client_property_nickname}
                  </span>
                )}
              </h3>
              {/*
              <p className="text-gray-700">{property.short_address}</p>
              <p className="text-sm text-gray-500">Status: {property.status}</p>
              <p className="text-sm text-gray-500">Client ID: {property.client_id}</p>
              {property.has_second_keyset && <p className="text-sm text-gray-500">Second Keys: {property.has_second_keyset}</p>}
              {property.ical && <p className="text-sm text-gray-500">iCal: {property.ical}</p>}
              */}
              {/* You can display more columns here */}
            </div>
          ))}
        </div>
      )}

      {/* NEW: Conditionally render the PropertyDetailPanel */}
      {selectedProperty && (
        <PropertyDetailPanel
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)} // Close panel when onClose is called
        />
      )}
    </DashboardLayout>
  )
}