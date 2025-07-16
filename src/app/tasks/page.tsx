// src/app/tasks/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from 'types/supabase';
import DashboardLayout from '../../components/DashboardLayout';
import type { PropertyWithClient } from '../../generated-types/customTypes.js';
import CreateTaskDrawer from '../../components/CreateTaskDrawer';


const supabase = createClientComponentClient<Database>();
type CleaningTask = Database['public']['Tables']['cleaning_tasks']['Row'];

type CleaningTaskWithProperty = CleaningTask & {
  properties: {
    short_address: string | null;
    client_property_nickname: string | null;
  };
  task_types: {
    name: string | null;
  } | null;
};

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
};

export default function AllTasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);
  const [tasks, setTasks] = useState<CleaningTaskWithProperty[]>([]);
  const [properties, setProperties] = useState<PropertyWithClient[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => (
      task.task_types?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    ));
  }, [tasks, searchTerm]);
  const selectedProperty = null;

  useEffect(() => {
    async function fetchUserAndTasks() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/');
        return;
      }
      setUser(userData.user);
      
    const { data: propertyList } = await supabase
      .from('properties')
      .select('*, clients(display_name)')
      .eq('platform_user_id', userData.user.id)
      .eq('status', 'active');
 
      if (propertyList) {
        setProperties(propertyList as PropertyWithClient[]);
      }

    const { data, error } = await supabase
        .from('cleaning_tasks')
        .select('*, properties(short_address, client_property_nickname), task_types(name)')
        .eq('platform_user_id', userData.user.id)
        .order('scheduled_date', { ascending: false });

      if (!error) setTasks(data || []);
      setLoading(false);
    }

    fetchUserAndTasks();
  }, [router]);

  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    const allSelected = tasks.length > 0 && tasks.every(t => selectedTaskIds.includes(t.id));
    const someSelected = tasks.some(t => selectedTaskIds.includes(t.id));
    headerCheckboxRef.current.indeterminate = someSelected && !allSelected;
  }, [tasks, selectedTaskIds]);

  if (loading) return <p className="p-8">Loading tasks...</p>;

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <h1 className="text-3xl font-bold">All Cleaning Tasks</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create New Task
            </button>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search tasks..."
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={filteredTasks.length > 0 && filteredTasks.every(task => selectedTaskIds.includes(task.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTaskIds(filteredTasks.map(task => task.id));
                      } else {
                        setSelectedTaskIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cleaner</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                          setSelectedTaskIds(prev => [...prev, task.id]);
                        } else {
                          setSelectedTaskIds(prev => prev.filter(id => id !== task.id));
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{task.scheduled_date}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                   {task.properties?.client_property_nickname || task.properties?.short_address || '—'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{task.task_types?.name || '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{task.priority_tag || '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{task.status}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">{task.assigned_cleaner_names || '—'}</td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {task.status !== 'Completed' ? (
                      <button
                        onClick={async () => {
                          console.log('Marking task as complete', task.id);
                          const { error } = await supabase
                            .from('cleaning_tasks')
                            .update({
                              status: 'Completed',
                              completed_on: new Date().toISOString(),
                              completed_by: user?.id || null,
                            })
                            .eq('id', task.id);

                          if (!error) {
                            setTasks((prev) =>
                              prev.map((t) =>
                                t.id === task.id
                                  ? { ...t, status: 'Completed', completed_on: new Date().toISOString(), completed_by: user?.id || null }
                                  : t
                              )
                            );
                          } else {
                            console.error('Error marking task as completed:', error.message);
                            alert('Could not mark task as completed');
                          }
                        }}
                        className="text-green-600 hover:underline"
                      >
                        Mark Complete
                      </button>
                    ) : (
                      <span className="text-gray-400 italic">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        {showDrawer && (
          <CreateTaskDrawer
            defaultProperty={selectedProperty}
            allProperties={properties}
            onClose={() => setShowDrawer(false)}
            onCreated={async () => {
              setShowDrawer(false);
              const { data } = await supabase
                .from('cleaning_tasks')
                .select('*, properties(short_address, client_property_nickname), task_types(name)')
                .eq('platform_user_id', user!.id)
                .order('scheduled_date', { ascending: false });

              if (data) setTasks(data);
            }}
          />
        )}
    </DashboardLayout>
  );
}
