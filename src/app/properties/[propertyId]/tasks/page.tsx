// src/app/properties/[propertyId]/tasks/page.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from 'types/supabase';
import PropertyDetailPageLayout from '../../../../components/PropertyDetailPageLayout';
import DashboardLayout from '../../../../components/DashboardLayout';
import { getPropertyNavigationItems } from '../../../../../supabase/functions/utils/getPropertyNavigation';
import { useState, useEffect, useRef } from 'react';
import type { PropertyWithClient } from 'src/generated-types/customTypes';
import CreateTaskDrawer from '../../../../components/CreateTaskDrawer';


type CleaningTaskWithType = Database['public']['Tables']['cleaning_tasks']['Row'] & {
  task_types?: {
    name: string;
  } | null;
};


const supabase = createClientComponentClient<Database>();

export function convertTasksToCSV(tasks: CleaningTaskWithType[]): string {
  const header = [
    'ID',
    'Scheduled Date',
    'Category',
    'Type',
    'Status',
    'Cleaner',
    'Coordinator',
    'Notes',
  ];
  const rows = tasks.map((task) => [
    task.id,
    task.scheduled_date,
    task.task_category,
    task.task_types?.name || '',
    task.status,
    task.assigned_cleaner_names ?? '',
    task.assigned_coordinator_name ?? '',
    task.notes ?? '',
  ]);
  return [header, ...rows].map(row => row.join(',')).join('\n');
}


export default function PropertyTasksPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<PropertyWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<CleaningTaskWithType[]>([]);
  type SupabaseAuthUser = {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
    };

  const [user, setUser] = useState<SupabaseAuthUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCleaners, setSelectedCleaners] = useState<string[]>([]);  
  const [showDrawer, setShowDrawer] = useState(false);
    const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
        task.task_types?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(task.task_category || '');

    const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(task.task_types?.name || '')

    const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(task.status || '');

    const matchesCleaner =
        selectedCleaners.length === 0 || selectedCleaners.includes(task.assigned_cleaner_names || '');

    return matchesSearch && matchesCategory && matchesType && matchesStatus && matchesCleaner;
    });

    useEffect(() => {
    if (!headerCheckboxRef.current) return;

    const allSelected = filteredTasks.length > 0 && filteredTasks.every((t) => selectedTaskIds.includes(t.id));
    const someSelected = filteredTasks.some((t) => selectedTaskIds.includes(t.id));

    headerCheckboxRef.current.indeterminate = someSelected && !allSelected;
    }, [filteredTasks, selectedTaskIds]);


  useEffect(() => {
    async function loadProperty() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/');
        return;
      }
      setUser(userData.user);

      const { data, error } = await supabase
        .from('properties')
        .select('*, clients(display_name)')
        .eq('id', Number(propertyId))
        .eq('platform_user_id', userData.user.id)
        .single();

      if (error) {
        setError('Failed to load property');
      } else {
        setProperty(data as PropertyWithClient);
      }
      setLoading(false);
    }

    loadProperty();
  }, [propertyId, router]);

    useEffect(() => {
    if (!user || !property) return;

    async function loadTasks() {
        const { data, error } = await supabase
        .from('cleaning_tasks')
        .select('*, task_types(name)')
        .eq('property_id', property!.id) // ✅ Type assertion
        .eq('platform_user_id', user!.id)
        .order('scheduled_date', { ascending: false });

        if (error) {
        console.error(error);
        setTasks([]);
        } else {
        setTasks(data);
        }
    }

    loadTasks();
    }, [property, user]);

  if (loading) return <p className="p-8">Loading...</p>;
  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!property) return <p className="p-8 text-gray-600">Property not found.</p>;

  return (
 
    <DashboardLayout>
      <PropertyDetailPageLayout
        property={property}
        propertyId={property.id}
        navigationItems={getPropertyNavigationItems(property.id, 'tasks')}
      >
        <h1 className="text-2xl font-bold mb-6">
          Tasks for {property.client_property_nickname || property.short_address}
        </h1>

        {/* 🔍 Search and Create Button */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <input
            type="text"
            placeholder="Search tasks..."
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button
            type="button"
            onClick={() => setShowDrawer(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
            Create New Task
        </button>
        </div>

        <div className="mb-6 space-y-4">
        {/* Category Filter */}
        <div>
            <label className="block font-semibold mb-1">Filter by Category:</label>
            <div className="flex gap-4 flex-wrap">
            {Array.from(new Set(tasks.map(t => t.task_category).filter(Boolean))).map((category) => (
                <label key={category} className="inline-flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={selectedCategories.includes(category!)}
                    onChange={(e) => {
                    setSelectedCategories((prev) =>
                        e.target.checked ? [...prev, category!] : prev.filter((c) => c !== category)
                    );
                    }}
                />
                <span className="text-sm text-gray-700">{category}</span>
                </label>
            ))}
            </div>
        </div>

        {/* Type Filter */}
        <div>
            <label className="block font-semibold mb-1">Filter by Type:</label>
            <div className="flex gap-4 flex-wrap">
            {Array.from(new Set(tasks.map(t => t.task_types?.name).filter(Boolean))).map((type) => (
                <label key={type} className="inline-flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={selectedTypes.includes(type!)}
                    onChange={(e) => {
                    setSelectedTypes((prev) =>
                        e.target.checked ? [...prev, type!] : prev.filter((t) => t !== type)
                    );
                    }}
                />
                <span className="text-sm text-gray-700">{type}</span>
                </label>
            ))}
            </div>
        </div>

        {/* Status Filter */}
        <div>
            <label className="block font-semibold mb-1">Filter by Status:</label>
            <div className="flex gap-4 flex-wrap">
            {Array.from(new Set(tasks.map(t => t.status).filter(Boolean))).map((status) => (
                <label key={status} className="inline-flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status!)}
                    onChange={(e) => {
                    setSelectedStatuses((prev) =>
                        e.target.checked ? [...prev, status!] : prev.filter((s) => s !== status)
                    );
                    }}
                />
                <span className="text-sm text-gray-700">{status}</span>
                </label>
            ))}
            </div>
        </div>

        {/* Cleaner Filter */}
        <div>
            <label className="block font-semibold mb-1">Filter by Cleaner:</label>
            <div className="flex gap-4 flex-wrap">
            {Array.from(new Set(tasks.map(t => t.assigned_cleaner_names).filter(Boolean))).map((cleaner) => (
                <label key={cleaner} className="inline-flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={selectedCleaners.includes(cleaner!)}
                    onChange={(e) => {
                    setSelectedCleaners((prev) =>
                        e.target.checked ? [...prev, cleaner!] : prev.filter((c) => c !== cleaner)
                    );
                    }}
                />
                <span className="text-sm text-gray-700">{cleaner}</span>
                </label>
            ))}
            </div>
        </div>
        </div>


        {selectedTaskIds.length > 0 && (
        <button
            type="button"
            className="text-sm text-blue-600 hover:underline mb-4"
            onClick={() => {
            const selected = filteredTasks.filter((task) => selectedTaskIds.includes(task.id));
            const csv = convertTasksToCSV(selected);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tasks_property_${propertyId}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            }}
        >
            Export to CSV
        </button>
        )}


        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                        ref={headerCheckboxRef}
                        type="checkbox"
                        checked={filteredTasks.length > 0 && filteredTasks.every((task) => selectedTaskIds.includes(task.id))}
                        onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedTaskIds(filteredTasks.map((task) => task.id));
                        } else {
                            setSelectedTaskIds([]);
                        }
                        }}
                    />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Scheduled Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cleaner</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Coordinator</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
            </thead>

                <tbody className="bg-white divide-y divide-gray-100">
                {filteredTasks.map(task => (
                    <tr key={task.id}>
                    <td className="px-4 py-2">
                        <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={(e) => {
                            if (e.target.checked) {
                            setSelectedTaskIds((prev) => [...prev, task.id]);
                            } else {
                            setSelectedTaskIds((prev) => prev.filter((id) => id !== task.id));
                            }
                        }}
                        />
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{task.scheduled_date}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{task.task_category}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{task.task_types?.name || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{task.status}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{task.assigned_cleaner_names || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{task.assigned_coordinator_name || '—'}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{task.notes || '—'}</td>
                    </tr>
                ))}
                </tbody>
          </table>
        </div>
      {showDrawer && property && (
        <CreateTaskDrawer
          defaultProperty={property} // 👈 prefilled and locked
          onClose={() => setShowDrawer(false)}
          onCreated={async () => {
            setShowDrawer(false);
            const { data } = await supabase
              .from('cleaning_tasks')
              .select('*, properties(short_address, client_property_nickname)')
              .eq('property_id', property.id)
              .order('scheduled_date', { ascending: false });

            if (data) setTasks(data);
          }}
        />
      )}

      </PropertyDetailPageLayout>
    </DashboardLayout>
  );
}
