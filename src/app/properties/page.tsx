// src/app/properties/page.tsx
'use client'

import { type User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/lib/supabase/client';
import DashboardLayout from '../../components/DashboardLayout';
import PropertyDetailPanel from '@/components/PropertyDetailPanel';
import { Info } from 'lucide-react';
import type { PropertyWithClient } from '@/generated-types/customTypes';

type PropertyFromDB = Omit<PropertyWithClient, 'property_icals'> & {
  property_icals: { url: string }[];
  property_specifics_items: {
    id: string;
    description: string;
    requires_photo: boolean;
  }[];
};

export default function PropertiesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [properties, setProperties] = useState<PropertyWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPropertiesForBulk, setSelectedPropertiesForBulk] = useState<number[]>([]); // For checkboxes
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithClient | null>(null);
  const router = useRouter()
  const [syncingAll, setSyncingAll] = useState(false);

  useEffect(() => {
    async function loadUserAndProperties() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/') // Redirect to homepage if no user logged in
        return
      }

      setUser(user)

      let query = supabase
        .from('properties')
        .select(`*, 
          clients(display_name),
          property_icals(url),
          cities(name),
          suburbs(name),
          property_service_types(name),
          property_specifics_items(id, description, requires_photo)
        `)
      .eq('platform_user_id', user.id);

      if (filter === 'active') {
        query = query.eq('status', 'active');
      }
      
      const { data: propertiesData, error: propertiesError } = await query;

      // Rename manually
      const renamedData = (propertiesData as PropertyFromDB[]).map((p) => ({
        ...p,
        property_icals: p.property_icals, // already correct
        property_specifics_items: p.property_specifics_items, // already correct
      }));

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        alert('Failed to load properties: ' + propertiesError.message);
      } else {
        const sortedProperties = (renamedData as PropertyWithClient[]).sort((a, b) => {
            const clientA = a.clients?.display_name || '';
            const clientB = b.clients?.display_name || '';
            return clientA.localeCompare(clientB);
        });
        setProperties(sortedProperties);
      }
      setLoading(false);
    }

    loadUserAndProperties();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };

  }, [router, filter]);

  // Filter properties based on the search term (applied to the already fetched and sorted list)
  const filteredProperties = properties.filter(property => {
    const searchContent = `${property.clients?.display_name || ''} ${property.client_property_nickname || ''} ${property.short_address || ''} ${property.status || ''} ${property.cities?.name || ''} ${property.suburbs?.name || ''} ${property.property_service_types?.name || ''}`.toLowerCase();
    return searchContent.includes(searchTerm.toLowerCase());
  });

  const handleCheckboxChange = (propertyId: number) => {
    setSelectedPropertiesForBulk((prevSelected) =>
      prevSelected.includes(propertyId)
        ? prevSelected.filter((id) => id !== propertyId)
        : [...prevSelected, propertyId]
    );
  };

  const handleCreateNewProperty = () => {
    // TODO: Implement navigation to a "Create New Property" form page
    alert('Implement navigation to Create New Property page!');
  };

  if (loading) {
    return <p className="p-8">Loading properties list...</p>;
  }

  if (!user) {
    return <p className="p-8">Redirecting to login...</p>;
  }

  return (
    <DashboardLayout>
      {selectedProperty && (
        <PropertyDetailPanel
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Manage Properties</h1>
        <button
          type="button"
          onClick={handleCreateNewProperty}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-orange-600 transition-colors"
        >
          Create New Property
        </button>
      </div>
    
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
        <button
          className="inline-block p-4 border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:border-blue-500 transition"
          onClick={async () => {
            const confirm = window.confirm('Are you sure you want to sync all iCals and generate tasks? This may take a few minutes.');
            if (!confirm) return;

            setSyncingAll(true);

            try {
              const response = await fetch('/api/sync-ical-all');
              const result = await response.json();

              if (!response.ok) {
                console.error('❌ Sync all iCals failed:', result?.error);
                alert(`Failed to sync iCals: ${result?.error}`);
              } else {
                console.log('✅ Sync results:', result.results);
                alert(`Sync complete. See console for details.`);
              }
            } catch (err) {
              if (err instanceof Error) {
                console.error('❌ Error syncing all iCals:', err.message);
                alert('An error occurred during sync. See console.');
              } else {
                console.error('❌ Unknown error syncing all iCals:', err);
              }
              setSyncingAll(false);
            }
          }}
        >
          🔄
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
      {syncingAll && (
        <div className="flex items-center gap-2 mt-4 text-blue-600">
          <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>Syncing all iCals... This may take a few minutes.</span>
        </div>
      )}

      {/* Bulk Actions Button (visible if properties are selected) */}
      {selectedPropertiesForBulk.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => alert(`Bulk actions for ${selectedPropertiesForBulk.length} properties`)}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-purple-600 transition-colors"
          >
            Perform Bulk Action ({selectedPropertiesForBulk.length} selected)
          </button>
        </div>
      )}

      {/* Conditional rendering based on filtered results */}
      {filteredProperties.length === 0 && searchTerm === '' ? (
        <p className="text-gray-600">You haven&apos;t added any properties yet...</p>
      ) : filteredProperties.length === 0 && searchTerm !== '' ? (
        <p className="text-gray-600">No properties found matching &quot;{searchTerm}&quot;.</p>
      ) : (
        // Properties Table/List View
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-centre text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPropertiesForBulk(filteredProperties.map(p => p.id));
                      } else {
                        setSelectedPropertiesForBulk([]);
                      }
                    }}
                    checked={selectedPropertiesForBulk.length === filteredProperties.length && filteredProperties.length > 0}
                    // This creates an indeterminate state if some but not all are selected
                    // indeterminate={selectedPropertiesForBulk.length > 0 && selectedPropertiesForBulk.length < filteredProperties.length}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-centre text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th scope="col" className="px-6 py-3 text-centre text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-centre text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th scope="col" className="px-6 py-3 text-centre text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suburb
                </th>
                <th scope="col" className="px-6 py-3 text-centre text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th scope="col" className="px-6 py-3 text-centre text-xs font-medium text-gray-500 uppercase tracking-wider">
                  iCal Link
                </th>
                {/* Placeholder for Last Clean, Next Clean, Issues */}
                <th scope="col" className="px-6 py-3 text-centre text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Clean (TODO)
                </th>
                <th scope="col" className="px-6 py-3 text-centre text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Clean (TODO)
                </th>
                <th scope="col" className="px-6 py-3 text-centre text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cleaning Issues (TODO)
                </th>
                <th scope="col" className="px-6 py-3 text-centre text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maintenance Issues (TODO)
                </th>
                <th scope="col" className="px-6 py-3 text-centre text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inspection Issues (TODO)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProperties.map((property) => (
                <tr key={property.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                      checked={selectedPropertiesForBulk.includes(property.id)}
                      onChange={() => handleCheckboxChange(property.id)}
                    />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => setSelectedProperty(property)}
                        className="text-gray-500 hover:text-blue-600"
                        title="View details"
                      >
                        <Info className="w-4 h-4" />
                      </button>

                      <span className="flex flex-wrap items-center gap-1 max-w-full">
                        {property.clients?.display_name && (
                          <span className="font-normal text-gray-800">
                            {property.clients.display_name} -{' '}
                          </span>
                        )}
                        <button
                          onClick={() => router.push(`/properties/${property.id}/calendar`)}
                          className="font-bold text-blue-700 hover:underline focus:outline-none whitespace-nowrap"
                        >
                          {property.short_address}
                        </button>
                        {property.client_property_nickname && (
                          <>
                            <span className="text-gray-400 mx-1">-</span>
                            <span className="font-normal text-gray-600">
                              {property.client_property_nickname}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.cities?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.suburbs?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.property_service_types?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.property_icals?.length > 0 ? (
                      <div className="flex flex-col space-y-1">
                        {property.property_icals.map((ical, index) => (
                          <a
                            key={index}
                            href={ical.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline truncate max-w-xs"
                            title={ical.url}
                          >
                            ICal Link {index + 1}
                          </a>
                        ))}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  {/* TODO: Add Last Clean, Next Clean, Cleaning Issues, etc. */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    --
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    --
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    --
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    --
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    --
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}