// src/app/properties\[propertyId]\activity\page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import supabase from '@/lib/supabase/client';
import PropertyDetailPageLayout from '../../../../components/PropertyDetailPageLayout'; // Update path as needed
import DashboardLayout from '../../../../components/DashboardLayout'; // Import the layout component
import type { PropertyWithClient } from 'src/generated-types/customTypes';
import { getPropertyNavigationItems } from '../../../../../supabase/functions/utils/getPropertyNavigation';
import type { ActivityLog } from '../../../../generated-types/activity-logs';
import { convertLogsToCSV } from '../../../../../supabase/functions/utils/export';
import { useState, useEffect, useRef } from 'react';

async function addTestActivityLog() {
  const { error } = await supabase.from('task_activity_log').insert([
    {
      task_id: 1, // existing cleaning_tasks.id
      type: 'Issue',
      title: 'Missing Towels',
      details: 'Guest reported no towels were available at check-in.',
      platform_user_id: '95150d9f-1a8d-4f76-9e62-17d7aab6d073',
      created_by: '95150d9f-1a8d-4f76-9e62-17d7aab6d073',
      visibility: 'public',
      metadata: null // <-- 👈 required
    }
  ]);

  if (error) {
    console.error('Error inserting log:', error.message);
    alert('Error: ' + error.message);
  } else {
    alert('Activity log inserted successfully');
  }
}


export default function PropertyDetailPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  } | null>(null);
  const [property, setProperty] = useState<PropertyWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLogIds, setSelectedLogIds] = useState<number[]>([]);
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);
  const filteredLogs = activityLogs.filter((log) => {
    const hasSearch = searchTerm.trim() !== '';
    const matchesSearch = log.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.details?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(log.type);

    // Show all logs if no filters; otherwise apply filters
    return (!hasSearch && selectedTypes.length === 0)
      || (matchesSearch && matchesType)
      || (!hasSearch && matchesType)
      || (hasSearch && selectedTypes.length === 0 && matchesSearch);
  });


  useEffect(() => {
    async function loadPropertyDetails() {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);

      if (!propertyId) {
        setError('Property ID is missing from URL.');
        setLoading(false);
        return;
      }

      const { data: propertyData, error: fetchError } = await supabase
        .from('properties')
        .select('*, clients(display_name)')
        .eq('id', Number(propertyId)) // Convert string to number
        .eq('platform_user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching property details:', fetchError);
        setError('Failed to load property details: ' + fetchError.message);
      } else if (!propertyData) {
        setError('Property not found or you do not have access.');
      } else {
        setProperty(propertyData as PropertyWithClient); // Cast to PropertyWithClient
      }
      setLoading(false);
    }

    loadPropertyDetails();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [propertyId, router]);

    useEffect(() => {
    if (!property || !user) return;

    async function fetchActivityLogs() {
      const { data, error } = await supabase
        .from('task_activity_log')
        .select(`
          *,
          cleaning_tasks!inner(property_id)
        `)
        .eq('cleaning_tasks.property_id', property!.id)
        .eq('platform_user_id', user!.id)
        .order('created_at', { ascending: false });


      if (error) {
        console.error('Error fetching activity logs:', error.message);
      } else {
        console.log('Fetched logs:', data);
        setActivityLogs(data);
      }
    }

    fetchActivityLogs();
  }, [property, user]);

  useEffect(() => {
    if (!headerCheckboxRef.current) return;

    const allVisibleSelected = filteredLogs.length > 0 &&
      filteredLogs.every((log) => selectedLogIds.includes(log.id));

    const someSelected = filteredLogs.some((log) => selectedLogIds.includes(log.id));

    headerCheckboxRef.current.indeterminate = someSelected && !allVisibleSelected;
  }, [filteredLogs, selectedLogIds]);

  if (loading) {
    return <p className="p-8">Loading property details...</p>;
  }

  if (!user) {
    return <p className="p-8">Redirecting to login...</p>;
  }

  if (error) {
    return <p className="p-8 text-red-600">Error: {error}</p>;
  }

  if (!property) {
    return <p className="p-8 text-gray-600">Property not found.</p>;
  }

  return (
    <DashboardLayout>
      <PropertyDetailPageLayout
        property={property}
        propertyId={property.id}
        navigationItems={getPropertyNavigationItems(property.id, 'activity')}

      >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Activity for {property.client_property_nickname || property.short_address}
        </h1>

        <button
          type="button"
          onClick={() =>
            alert(
              `Create new task for property: ${
                property.client_property_nickname || property.short_address
              }`
            )
          }
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Create New Task
        </button>

        <button
          type="button"
          onClick={addTestActivityLog}
          className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700"
        >
          Insert Sample Log
        </button>

      </div>

      {/* 🔍 Search Box */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search activity log..."
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {searchTerm.trim() ? (
        filteredLogs.length > 0 ? (
          <ul className="space-y-2">
            {filteredLogs.map((log) => (
              <li key={log.id} className="border p-3 rounded bg-white shadow-sm">
                <p className="text-sm font-medium text-blue-700">{log.title || '(No title)'}</p>
                <p className="text-xs text-gray-600">{log.details}</p>
                <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No matching activity logs found.</p>
        )
      ) : null}

      { activityLogs.length === 0 && (
        <p className="text-gray-500 mt-4">No activity logs available yet.</p>
      )}

      <div className="mb-6">
        <label className="block font-semibold mb-2">Filter by type:</label>
        <div className="flex gap-4 flex-wrap">
          {['Issue', 'Expense', 'Status Update', 'Comment'].map((type) => (
            <label key={type} className="inline-flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={(e) => {
                  setSelectedTypes((prev) =>
                    e.target.checked
                      ? [...prev, type]
                      : prev.filter((t) => t !== type)
                  );
                }}
              />
              <span className="text-sm text-gray-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Bulk */}
      {selectedLogIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-yellow-50 border border-yellow-200 px-4 py-2 rounded">
          <span>{selectedLogIds.length} log(s) selected</span>
          <button
            type="button"
            onClick={() => {
              const selectedLogs = filteredLogs.filter(log => selectedLogIds.includes(log.id));
              const csv = convertLogsToCSV(selectedLogs);
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `activity_logs_property_${propertyId}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Export to CSV
          </button>
        </div>
      )}


      {/* Table */}
      <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={
                    filteredLogs.length > 0 &&
                    filteredLogs.every((log) => selectedLogIds.includes(log.id))
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLogIds((prev) => [
                        ...prev,
                        ...filteredLogs
                          .filter((log) => !prev.includes(log.id))
                          .map((log) => log.id),
                      ]);
                    } else {
                      setSelectedLogIds((prev) =>
                        prev.filter((id) => !filteredLogs.map((log) => log.id).includes(id))
                      );
                    }
                  }}
                />
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">By</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedLogIds.includes(log.id)}
                    onChange={(e) => {
                      setSelectedLogIds((prev) =>
                        e.target.checked
                          ? prev.includes(log.id) ? prev : [...prev, log.id]
                          : prev.filter((id) => id !== log.id)
                      );
                    }}
                  />
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">{log.type}</td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{log.title}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{log.details}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{log.created_by || 'N/A'}</td>
              </tr>
            ))}
          </tbody>


        </table>
      </div>

      </PropertyDetailPageLayout>
    </DashboardLayout>
  );
}
