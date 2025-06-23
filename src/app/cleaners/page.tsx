'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../types/supabase.ts';
import DashboardLayout from '../../components/DashboardLayout.tsx';
import { useRef } from 'react';


type Cleaner = Database['public']['Tables']['cleaners']['Row'];

const supabase = createClientComponentClient<Database>();


export default function CleanersPage() {
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);  
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [selectedCleaners, setSelectedCleaners] = useState<number[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserAndCleaners() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/');
        return;
      }
      setUserId(userData.user.id);

      let query = supabase
        .from('cleaners')
        .select('*')
        .eq('platform_user_id', userData.user.id);

      if (filter === 'active') {
        query = query.eq('active', true);
      }

      const { data, error } = await query.order('display_name', { ascending: true });

      if (error) {
        console.error('Error fetching cleaners:', error.message);
      } else {
        setCleaners(data || []);
      }
      setLoading(false);
    }

    fetchUserAndCleaners();
  }, [router, filter]);

  const filteredCleaners = cleaners.filter(c =>
    c.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!headerCheckboxRef.current) return;

    const allVisibleSelected = filteredCleaners.length > 0 &&
        filteredCleaners.every((c) => selectedCleaners.includes(c.id));

    const someSelected = filteredCleaners.some((c) => selectedCleaners.includes(c.id));

    headerCheckboxRef.current.indeterminate = someSelected && !allVisibleSelected;
    }, [filteredCleaners, selectedCleaners]);


  const handleCheckboxChange = (cleanerId: number) => {
    setSelectedCleaners(prev =>
      prev.includes(cleanerId)
        ? prev.filter(id => id !== cleanerId)
        : [...prev, cleanerId]
    );
  };

  if (loading) return <p className="p-6">Loading cleaners...</p>;

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Cleaners</h1>

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
          placeholder="Search cleaners..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md mb-4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Cleaners Counter */}
        <p className="text-lg font-medium mb-4">
          Currently displaying {filteredCleaners.length} {filter === 'active' ? 'active' : 'total'} cleaners.
        </p>

        {/* Bulk Actions Button */}
        {selectedCleaners.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => alert(`Bulk actions for ${selectedCleaners.length} cleaners`)}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-purple-600 transition-colors"
            >
              Perform Bulk Action ({selectedCleaners.length} selected)
            </button>
          </div>
        )}

        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    onChange={(e) => {
                        if (e.target.checked) {
                        setSelectedCleaners(filteredCleaners.map(c => c.id));
                        } else {
                        setSelectedCleaners([]);
                        }

                        // Optional: Clear indeterminate on click
                        if (headerCheckboxRef.current) {
                        headerCheckboxRef.current.indeterminate = false;
                        }
                    }}
                    checked={filteredCleaners.length > 0 && selectedCleaners.length === filteredCleaners.length}
                    />
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCleaners.map((cleaner) => (
                <tr key={cleaner.id}>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={selectedCleaners.includes(cleaner.id)}
                      onChange={() => handleCheckboxChange(cleaner.id)}
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {cleaner.active ? '✅ Active' : '❌ Inactive'}
                  </td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{cleaner.display_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{cleaner.city}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{cleaner.mobile}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{cleaner.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
