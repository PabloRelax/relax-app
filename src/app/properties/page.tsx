// src/app/properties/page.tsx
'use client'

import { type User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database, Tables } from '../../types/supabase.ts'

import DashboardLayout from '../../components/DashboardLayout.tsx';
// We won't use PropertyDetailPanel directly here, as clicking will navigate to a new page.
// import PropertyDetailPanel from '@/components/PropertyDetailPanel'; // Not needed here

const supabase = createClientComponentClient<Database>()

type PropertyWithClient = Tables<'properties'> & {
  clients: Pick<Tables<'clients'>, 'display_name'> | null;
};

export default function PropertiesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [properties, setProperties] = useState<PropertyWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPropertiesForBulk, setSelectedPropertiesForBulk] = useState<number[]>([]); // For checkboxes
  const router = useRouter()

  useEffect(() => {
    async function loadUserAndProperties() {
      setLoading(true)
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/') // Redirect to homepage if no user logged in
        return
      }

      setUser(userData.user)

      let query = supabase
        .from('properties')
        .select('*, clients(display_name)') // Select all properties fields, and client display name
        .eq('platform_user_id', userData.user.id) // Filter by the current user's ID

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

  // Filter properties based on the search term (applied to the already fetched and sorted list)
  const filteredProperties = properties.filter(property => {
    const searchContent = `${property.clients?.display_name || ''} ${property.client_property_nickname || ''} ${property.short_address || ''} ${property.status || ''} ${property.city || ''} ${property.suburb || ''} ${property.service_type || ''}`.toLowerCase();
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Properties</h1>
        <button
          type="button"
          onClick={handleCreateNewProperty}
          className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-600 transition-colors"
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
        <p className="text-gray-600">You haven't added any properties yet. Add one to get started!</p>
      ) : filteredProperties.length === 0 && searchTerm !== '' ? (
        <p className="text-gray-600">No properties found matching "{searchTerm}".</p>
      ) : (
        // Properties Table/List View
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suburb
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  iCal Link
                </th>
                {/* Placeholder for Last Clean, Next Clean, Issues */}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Clean (TODO)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Clean (TODO)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cleaning Issues (TODO)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maintenance Issues (TODO)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                    onClick={() => router.push(`/properties/${property.id}/calendar`)}
                  >
                    {property.clients?.display_name && (
                      <span className="font-normal text-gray-800">
                        {property.clients.display_name} -{' '}
                      </span>
                    )}
                    <span className="font-bold text-blue-700">
                      {property.short_address}
                    </span>
                    {property.client_property_nickname && (
                      <>
                        <span className="text-gray-400 mx-1">-</span>
                        <span className="font-normal text-gray-600">{property.client_property_nickname}</span>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.city}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.suburb}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.service_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {property.ical ? (
                        <a href={property.ical} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Link</a>
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