// src\app\clients\page.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../types/supabase.ts';
import DashboardLayout from '../../components/DashboardLayout.tsx';

type Client = Database['public']['Tables']['clients']['Row'];

const supabase = createClientComponentClient<Database>();

export default function ClientsPage() {
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const router = useRouter();

    useEffect(() => {
    async function fetchUserAndClients() {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
        router.push('/');
        return;
        }
        setUserId(userData.user.id);

        let query = supabase
        .from('clients')
        .select('*')
        .eq('platform_user_id', userData.user.id);

        if (filter === 'active') {
        query = query.eq('active', true);
        }

        const { data, error } = await query.order('display_name', { ascending: true });

        if (error) {
        console.error('Error fetching clients:', error.message);
        } else {
        setClients(data || []);
        }
        setLoading(false);
    }

    fetchUserAndClients();
    }, [router, filter]);


  const filteredClients = clients.filter(c =>
    c.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!headerCheckboxRef.current) return;

    const allVisibleSelected = filteredClients.length > 0 &&
      filteredClients.every((c) => selectedClients.includes(c.id));

    const someSelected = filteredClients.some((c) => selectedClients.includes(c.id));

    headerCheckboxRef.current.indeterminate = someSelected && !allVisibleSelected;
  }, [filteredClients, selectedClients]);

  const handleCheckboxChange = (clientId: number) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  if (loading) return <p className="p-6">Loading clients...</p>;

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Clients</h1>

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


        <input
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md mb-4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <p className="text-lg font-medium mb-4">
          Currently displaying {filteredClients.length} clients.
        </p>

        {selectedClients.length > 0 && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => alert(`Bulk actions for ${selectedClients.length} clients`)}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-purple-600 transition-colors"
            >
              Perform Bulk Action ({selectedClients.length} selected)
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
                        setSelectedClients(filteredClients.map(c => c.id));
                      } else {
                        setSelectedClients([]);
                      }
                      if (headerCheckboxRef.current) {
                        headerCheckboxRef.current.indeterminate = false;
                      }
                    }}
                    checked={filteredClients.length > 0 && selectedClients.length === filteredClients.length}
                  />
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id}>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleCheckboxChange(client.id)}
                    />
                  </td>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{client.display_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{client.phone || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{client.email || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{client.type || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
