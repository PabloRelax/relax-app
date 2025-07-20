// src/app/operations/page.tsx
'use client'

import { useEffect, useState } from 'react';
import type { OperationsTask } from '@/generated-types/operations';
import DashboardLayout from '@/components/DashboardLayout';
import { PencilIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import supabase from '@/lib/supabase/client';

export default function OperationsPage() {
  const [tasks, setTasks] = useState<OperationsTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [groupedTasks, setGroupedTasks] = useState<Map<string, OperationsTask[]>>(new Map());
  const [visibleCleanerIndexes, setVisibleCleanerIndexes] = useState<number[]>([]);
  const [allCleaners, setAllCleaners] = useState<{ id: number; display_name: string }[]>([]);
  const [editingCleaner, setEditingCleaner] = useState<{ taskId: number; index: number } | null>(null);
  const [editingNotesTaskId, setEditingNotesTaskId] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>('');

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      const { data, error } = await supabase
        .from('operations_table_view')
        .select(`
          *,
          cleaner1_name,
          cleaner2_name,
          cleaner3_name,
          cleaner4_name,
          cleaner1_id,
          cleaner2_id,
          cleaner3_id,
          cleaner4_id
        `)
        .order('scheduled_date', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching tasks:', error);
        setError(error.message);
      } else {
        const sorted = [...(data as OperationsTask[])].sort((a, b) => {
          const cityCompare = a.city_short_name?.localeCompare(b.city_short_name ?? '') ?? 0;
          if (cityCompare !== 0) return cityCompare;

          return (a.priority_tag ?? '').localeCompare(b.priority_tag ?? '');
        });

        setVisibleCleanerIndexes([1, 2]);

        setTasks(sorted);

        // Group tasks by scheduled_date (e.g., "2025-07-02")
        const grouped = new Map<string, OperationsTask[]>();
        sorted.forEach((task) => {
          const date = task.scheduled_date;
          if (!grouped.has(date)) grouped.set(date, []);
          grouped.get(date)!.push(task);
        });
        setGroupedTasks(grouped);
      }
      setLoading(false);
    }

    async function fetchCleaners() {
      const { data, error } = await supabase
        .from('cleaners')
        .select('id, display_name')
        .eq('active', true)
        .order('display_name', { ascending: true });

      if (error) {
        console.error('Error loading cleaners:', error.message);
        return;
      }

      setAllCleaners(data || []);
    }

    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user ? { id: user.id } : null);
    }
    fetchUser();

    fetchTasks();
    fetchCleaners();
  }, []);

  const renderColGroup = () => (
    <colgroup>
      <col style={{ width: '4%' }} />
      <col style={{ width: '10%' }} />
      <col style={{ width: '18%' }} />
      <col style={{ width: '6%' }} />
      {visibleCleanerIndexes.map((_, i) => (
        <col key={`col-cleaner-${i}`} style={{ width: '10%' }} /> 
      ))}
      <col style={{ width: '8%' }} />
      <col style={{ width: '12%' }} />
      <col style={{ width: '10%' }} />
      <col style={{ width: '14%' }} />
      <col style={{ width: '6%' }} />
      <col style={{ width: '8%' }} />
    </colgroup>
  );

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-4">Live Operations Tracker</h1>

      {loading && <p>Loading tasks...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && tasks.length === 0 && (
        <p className="text-gray-600">No recent tasks to display.</p>
      )}

      {!loading && !error && tasks.length > 0 && (
        <div className="space-y-4">
            {Array.from(groupedTasks.entries()).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime()).map(([date, tasksForDate]) =>
              tasksForDate.length === 0 ? null : (
                <div key={date} className="overflow-x-auto border rounded-md shadow-sm">

                <details open>
                  <summary className="bg-gray-100 px-4 py-0 cursor-pointer font-semibold text-sm">
                    {new Date(date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </summary>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      {renderColGroup()}
                      <thead className="bg-blue-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-0 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                          <th className="px-4 py-0 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                          <th className="px-4 py-0 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                          <th className="px-4 py-0 text-left text-xs font-medium text-gray-500 uppercase">TAG</th>
                          {visibleCleanerIndexes.map((i) => (
                            <th
                              key={`cleaner-th-${i}`}
                              className="px-4 py-0 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              Cleaner {i}
                            </th>
                          ))}
                          <th className="px-4 py-0 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-0 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                          <th className="px-4 py-0 text-left text-xs font-medium text-gray-500 uppercase">Confirm</th>
                          <th className="px-4 py-0 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                          <th className="px-4 py-0 text-left text-xs font-medium text-gray-500 uppercase">Photos</th>
                          <th className="px-4 py-0 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {tasksForDate.map((task) => (
                          <tr key={task.task_id} className="hover:bg-gray-50">
                            <td className="px-4 py-1 text-sm text-gray-700 whitespace-nowrap">
                              {task.priority_tag === 'Departure Clean' ? '' : task.priority_tag}
                            </td>
                            <td className="px-4 py-1 text-sm text-gray-700 max-w-[200px] overflow-hidden truncate">
                              {task.client_display_name}
                            </td>
                            <td className="px-4 py-1 text-sm text-gray-700">
                              <div className="flex items-center space-x-2">
                                {task.city_short_name && (
                                  <span
                                    className="inline-block text-xs font-bold text-white rounded px-2 py-1"
                                    style={{ backgroundColor: task.city_color_tag ?? '#999' }}
                                  >
                                    {task.city_short_name}
                                  </span>
                                )}
                                <span className="text-sm text-gray-900 font-medium">
                                  {task.short_address}
                                  {task.client_property_nickname ? ` - ${task.client_property_nickname}` : ''}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-1 text-sm text-gray-700 max-w-[200px] overflow-hidden truncate">
                              {task.task_type_name}
                            </td>
                            {visibleCleanerIndexes.map((i) => (
                              <td
                                key={`cleaner-td-${task.task_id}-${i}`}
                                className="px-4 py-1 text-sm text-gray-700 whitespace-nowrap"
                              >
                            {editingCleaner?.taskId === task.task_id && editingCleaner.index === i ? (
                              <div
                                  className={`transition-all duration-300 ease-out transform ${
                                  editingCleaner?.taskId === task.task_id && editingCleaner.index === i
                                    ? 'opacity-100 scale-100'
                                    : 'opacity-0 scale-95'
                                }`}
                              >
                                <select
                                  value={(task[`cleaner${i}_id` as keyof OperationsTask] as number | null) || ''}
                                  onChange={async (e) => {
                                    const cleanerId = e.target.value ? Number(e.target.value) : null;
                                    const fieldName = `cleaner${i}_id`;
                                    const nameField = `cleaner${i}_name`;

                                    const { error } = await supabase
                                      .from('cleaning_tasks')
                                      .update({ [fieldName]: cleanerId })
                                      .eq('id', task.task_id);

                                    if (!error) {
                                      setTasks((prev) => {
                                        const updated = prev.map((t) =>
                                          t.task_id === task.task_id
                                            ? {
                                                ...t,
                                                [fieldName]: cleanerId,
                                                [nameField]: allCleaners.find((c) => c.id === cleanerId)?.display_name ?? null,
                                              }
                                            : t
                                        );

                                        const newGrouped = new Map<string, OperationsTask[]>();
                                        updated.forEach((t) => {
                                          if (!newGrouped.has(t.scheduled_date)) newGrouped.set(t.scheduled_date, []);
                                          newGrouped.get(t.scheduled_date)!.push(t);
                                        });

                                        setGroupedTasks(newGrouped);
                                        return updated;
                                      });

                                      setEditingCleaner(null);
                                    } else {
                                      alert('Could not assign cleaner.');
                                      console.error('Error updating cleaner:', error.message);
                                    }
                                  }}
                                  onBlur={() => setEditingCleaner(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') setEditingCleaner(null);
                                  }}
                                  className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                >
                                  <option value="">Unassigned</option>
                                  {allCleaners.map((cleaner) => (
                                    <option key={cleaner.id} value={cleaner.id}>
                                      {cleaner.display_name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              (() => {
                                const idField = `cleaner${i}_id` as keyof OperationsTask;
                                const nameField = `cleaner${i}_name` as keyof OperationsTask;

                                const cleanerId = task[idField] as number | null | undefined;
                                const cleanerName = task[nameField] as string | null | undefined;
                                const hasCleaner = cleanerId != null;

                                return (
                                  <div className="flex items-center gap-1">
                                    <span className="min-w-[60px]">{cleanerName || ''}</span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
                                        onClick={() => setEditingCleaner({ taskId: task.task_id, index: i })}
                                        aria-label={hasCleaner ? 'Edit cleaner assignment' : 'Assign cleaner'}
                                        title={hasCleaner ? 'Edit cleaner' : 'Assign cleaner'}
                                      >
                                        {hasCleaner ? (
                                          <PencilIcon className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                                        ) : (
                                          <PlusIcon className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                                        )}
                                      </button>
                                      {hasCleaner && (
                                        <button
                                          className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={async () => {
                                            const { error } = await supabase
                                              .from('cleaning_tasks')
                                              .update({ [idField]: null })
                                              .eq('id', task.task_id);

                                            if (!error) {
                                              setTasks((prev) => {
                                                const updated = prev.map((t) =>
                                                  t.task_id === task.task_id
                                                    ? { ...t, [idField]: null, [nameField]: null }
                                                    : t
                                                );

                                                const newGrouped = new Map<string, OperationsTask[]>();
                                                updated.forEach((t) => {
                                                  if (!newGrouped.has(t.scheduled_date)) newGrouped.set(t.scheduled_date, []);
                                                  newGrouped.get(t.scheduled_date)!.push(t);
                                                });

                                                setGroupedTasks(newGrouped);
                                                return updated;
                                              });
                                            } else {
                                              console.error('Error clearing cleaner:', error.message);
                                              alert('Could not clear cleaner.');
                                            }
                                          }}
                                          aria-label="Remove cleaner assignment"
                                          title="Remove cleaner"
                                        >
                                          <XMarkIcon className="h-4 w-4 text-gray-500 hover:text-red-600" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()
                            )}
                          </td>
                            ))}
                            <td className="px-4 py-1 text-sm text-gray-700">
                              {task.status !== 'Completed' ? (
                                <button
                                  onClick={async () => {
                                    const { error } = await supabase
                                      .from('cleaning_tasks')
                                      .update({
                                        status: 'Completed',
                                        completed_on: new Date().toISOString(),
                                        completed_by: user?.id ?? null,
                                      })
                                      .eq('id', task.task_id);

                                    if (!error) {
                                      setTasks((prev) => {
                                        const updated = prev.map((t) =>
                                          t.task_id === task.task_id
                                            ? { ...t, status: 'Completed', completed_on: new Date().toISOString() }
                                            : t
                                        );

                                        const newGrouped = new Map<string, OperationsTask[]>();
                                        updated.forEach((t) => {
                                          if (!newGrouped.has(t.scheduled_date)) newGrouped.set(t.scheduled_date, []);
                                          newGrouped.get(t.scheduled_date)!.push(t);
                                        });

                                        setGroupedTasks(newGrouped);
                                        return updated;
                                      });
                                    } else {
                                      console.error('Error marking complete:', error.message);
                                      alert('Could not mark as completed.');
                                    }
                                  }}
                                  className="text-green-600 hover:underline"
                                >
                                  Mark Complete
                                </button>
                              ) : (
                                <span className="inline-block px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                  Completed
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-1 text-sm text-gray-700">
                              {[task.cleaning_issues, task.maintenance_issues, task.inspection_issues]
                                .filter(Boolean)
                                .map((issue) => `• ${issue}`)
                                .join('\n')}
                            </td>
                            <td className="px-4 py-1 text-sm text-gray-700">
                              {[
                                { key: 'special_request_confirmed', label: 'Special Request' },
                                { key: 'property_specifics_confirmed', label: 'Property Specifics' },
                                { key: 'key_situation_confirmed', label: 'Key' },
                                { key: 'second_keyset_confirmed', label: '2nd Key' },
                              ].map(({ key, label }) => (
                                <span key={key} title={label} className="inline-block mr-1 text-lg">
                                  {task[key as keyof typeof task] ? '✅' : '❌'}
                                </span>
                              ))}
                            </td>
                            <td className="px-4 py-1 text-sm text-gray-700 max-w-xs">
                              {editingNotesTaskId === task.task_id ? (
                                <textarea
                                  value={notesDraft}
                                  onChange={(e) => setNotesDraft(e.target.value)}
                                  onBlur={async () => {
                                    const { error } = await supabase
                                      .from('cleaning_tasks')
                                      .update({ coordinator_notes: notesDraft })
                                      .eq('id', task.task_id);

                                    if (!error) {
                                      setTasks((prev) => {
                                        const updated = prev.map((t) =>
                                          t.task_id === task.task_id
                                            ? { ...t, coordinator_notes: notesDraft }
                                            : t
                                        );

                                        const newGrouped = new Map<string, OperationsTask[]>();
                                        updated.forEach((t) => {
                                          if (!newGrouped.has(t.scheduled_date)) newGrouped.set(t.scheduled_date, []);
                                          newGrouped.get(t.scheduled_date)!.push(t);
                                        });

                                        setGroupedTasks(newGrouped);
                                        return updated;
                                      });

                                    } else {
                                      alert('Failed to update note.');
                                    }

                                    setEditingNotesTaskId(null);
                                  }}
                                  autoFocus
                                  rows={3}
                                  className="w-full p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingNotesTaskId(task.task_id);
                                    setNotesDraft(task.coordinator_notes || '');
                                  }}
                                  className="text-left w-full"
                                  title="Click to edit notes"
                                >
                                  {task.coordinator_notes ? (
                                    <span>
                                      {task.coordinator_notes.length > 40
                                        ? task.coordinator_notes.slice(0, 40) + '…'
                                        : task.coordinator_notes}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 italic">No notes</span>
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-1 text-sm text-blue-600">
                              {task.photos_link ? (
                                <a
                                  href={task.photos_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  View
                                </a>
                              ) : (
                                <span className="text-gray-400 italic">—</span>
                              )}
                            </td>
                            <td className="px-4 py-1 text-sm text-gray-700 space-x-2 whitespace-nowrap">
                              <button
                                className="text-blue-600 hover:underline"
                                onClick={() => alert(`TODO: Edit task ${task.task_id}`)}
                              >
                                Edit
                              </button>
                              <button
                                className="text-blue-600 hover:underline"
                                onClick={() => alert(`TODO: Add note to task ${task.task_id}`)}
                              >
                                Add Note
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            ))}
        </div>
      )}
    </DashboardLayout>
  );
}
