// src/app/operations/page.tsx
'use client'

import { useEffect, useState } from 'react';
import type { OperationsTask } from '@/generated-types/operations';
import DashboardLayout from '@/components/DashboardLayout';
import { PencilIcon, PlusIcon, XMarkIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import supabase from '@/lib/supabase/client';
import { makeProgressKey } from '@/lib/checklistkey';

type PropertySpecificItem = {
  item_id: string;
  description: string;
  requires_photo: boolean;
};

type SpecialRequirementItem = {
  item_id: string;
  description: string;
  requires_photo: boolean;
};

type EnrichedOperationsTask = OperationsTask & {
  property_id: number; // 👈 required for lookup in property_specifics_items
  special_requirements_items?: SpecialRequirementItem[];
  property_specifics_items?: PropertySpecificItem[];
};

const CITY_COLOURS: Record<string, string> = {
  BNE: '#dbeafe', // optional hard overrides
  SYD: '#dcfce7',
  MEL: '#fef3c7',
};

function pastelBg(task: any) {
  // prefer your map, then DB color, then fallback
  const base =
    CITY_COLOURS[task.city_short_name?.toUpperCase?.() || ''] ??
    task.city_color_tag ??
    '#64748b';

  // If hex like #RRGGBB, append alpha for a pastel on white bg.
  // 33 ≈ 20% opacity, 4D ≈ 30%, 66 ≈ 40% (use 66 if you want white text to be readable)
  const alpha = '66';
  if (/^#([0-9a-f]{6})$/i.test(base)) return `${base}${alpha}`;

  // Fallback: just use a very light neutral
  return '#e2e8f066';
}

// Prefer DB color_tag. Fallback is a soft neutral.
function getCityBadgeColor(task: { city_short_name?: string | null; city_color_tag?: string | null }) {
  return task.city_color_tag || '#cbd5e1'; // slate-300 fallback
}

async function loadPropertySpecificsItems(propertyId: number): Promise<PropertySpecificItem[]> {
  const { data, error } = await supabase
    .from('property_specifics_items')
    .select('id, description, requires_photo')
    .eq('property_id', propertyId);

  if (error) {
    console.warn('Error loading property_specifics_items for property', propertyId, error);
    return [];
  }

  return (data || []).map((item) => ({
    item_id: item.id,
    description: item.description,
    requires_photo: item.requires_photo,
  }));
}

async function loadSpecialRequirementsItems(taskId: number): Promise<SpecialRequirementItem[]> {
  const { data, error } = await supabase
    .from('special_requirements_items')
    .select('id, description, requires_photo')
    .eq('task_id', taskId);

  if (error) {
    console.warn('Error loading special_requirements_items for task', taskId, error);
    return [];
  }

  return (data || []).map((item) => ({
    item_id: item.id,
    description: item.description,
    requires_photo: item.requires_photo,
  }));
}

function extractCleanersFromTask(task: any) {
  return Array.from({ length: 4 }, (_, i) => {
    const idx = i + 1;
    return {
      slotIndex: idx,
      id: task[`cleaner${idx}_id`] ?? null,
      name: task[`cleaner${idx}_name`] ?? '',
    };
  });
}

export default function OperationsPage() {
  const [tasks, setTasks] = useState<EnrichedOperationsTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [groupedTasks, setGroupedTasks] = useState<Map<string, EnrichedOperationsTask[]>>(new Map());
  const [visibleCleanerIndexes, setVisibleCleanerIndexes] = useState<number[]>([]);
  const [allCleaners, setAllCleaners] = useState<{ id: number; display_name: string }[]>([]);
  const [editingCleaner, setEditingCleaner] = useState<{ taskId: number; index: number } | null>(null);
  const [editingNotesTaskId, setEditingNotesTaskId] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [taskChecklistProgress, setTaskChecklistProgress] = useState<Record<string, { checked: boolean }>>({});

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;

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
          cleaner4_id,
          started_at,
          completed_on
        `)
        .order('scheduled_date', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching tasks:', error);
        setError(error.message);
      } else {
        const sorted = [...(data as EnrichedOperationsTask[])].sort((a, b) => {
          const cityCompare = a.city_short_name?.localeCompare(b.city_short_name ?? '') ?? 0;
          if (cityCompare !== 0) return cityCompare;

          return (a.priority_tag ?? '').localeCompare(b.priority_tag ?? '');
        });

        setVisibleCleanerIndexes([1, 2]);     

        const enrichedTasks: EnrichedOperationsTask[] = await Promise.all(
          sorted.map(async (task) => {
            const [propertyItems, specialItems] = await Promise.all([
              loadPropertySpecificsItems(task.property_id),
              loadSpecialRequirementsItems(task.task_id),
            ]);

            return {
              ...task,
              property_specifics_items: propertyItems,
              special_requirements_items: specialItems,
            };
          })
        );

        setTasks(enrichedTasks);

        const { data: progressData, error: progressError } = await supabase
          .from('task_checklist_progress')
          .select('task_id, item_id, item_type, checked, cleaner_id');

        if (progressError) {
          console.error('❌ Error loading checklist progress:', progressError.message);
        } else {
          const progressMap: Record<string, { checked: boolean; cleaner_id: number | null }> = {};
          for (const row of progressData || []) {
            const key = makeProgressKey(row.task_id, row.item_type as 'property' | 'special', row.item_id);
            progressMap[key] = { checked: row.checked, cleaner_id: row.cleaner_id };
          }

          const finalMap: Record<string, { checked: boolean }> = {};
          Object.entries(progressMap).forEach(([key, value]) => {
            finalMap[key] = { checked: value.checked };
          });

          setTaskChecklistProgress(finalMap);
        }

        // Group tasks by scheduled_date (e.g., "2025-07-02")
        const grouped = new Map<string, EnrichedOperationsTask[]>();
        enrichedTasks.forEach((task) => {
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

    async function fetchAll() {
      await fetchUser();
      await fetchTasks();
      await fetchCleaners();
    }

    fetchAll();

    //const intervalId = setInterval(fetchTasks, 120000); // every 120 seconds // remove after testing

    console.log('👂 Setting up subscription to cleaning_tasks updates...');

    subscription = supabase
      .channel('realtime:operations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cleaning_tasks',
        },
        async (payload) => {
          console.log('📦 Realtime task update payload received:', payload);
          const updatedId = payload.new.id;
          console.log('🔎 Fetching updated task_id from view:', updatedId);

          try {
            const { data: fullTask, error } = await supabase
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
                cleaner4_id,
                started_at,
                finished_at,
                completed_on
              `)
              .eq('task_id', updatedId)
              .maybeSingle();

            if (error) {
              console.error('❌ Error fetching task from view:', error);
              return;
            }
            if (!fullTask) {
              console.warn(`⚠️ No task found in view for task_id ${updatedId}`);
              return;
            }

            // ⬇️ Re-enrich with BOTH lists so the UI doesn't lose them
            const [propertyItems, specialItems] = await Promise.all([
              loadPropertySpecificsItems(fullTask.property_id),
              loadSpecialRequirementsItems(fullTask.task_id),
            ]);

            setTasks((prev) => {
              const updated = prev.map((t) =>
                t.task_id === updatedId
                  ? {
                      ...fullTask,
                      property_specifics_items: propertyItems,
                      special_requirements_items: specialItems,
                    }
                  : t
              );
              // ... keep the rest of your regrouping logic the same
              const newGrouped = new Map<string, EnrichedOperationsTask[]>();
              updated.forEach((t) => {
                if (!newGrouped.has(t.scheduled_date)) newGrouped.set(t.scheduled_date, []);
                newGrouped.get(t.scheduled_date)!.push(t);
              });

              setGroupedTasks(newGrouped);
              return updated;
            });
          } catch (err) {
            console.error('🚨 Unexpected error while updating task state:', err);
          }

        }
      )
      .subscribe();

      const checklistSub = supabase
        .channel('realtime:task_checklist_progress')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'task_checklist_progress',
          },
          (payload) => {
            const row = payload.new as {
              task_id?: number;
              item_type?: string;
              item_id?: string;
              checked?: boolean;
            };

            if (!row?.task_id || !row?.item_type || !row?.item_id) return;

            const key = makeProgressKey(
              row.task_id as number,
              row.item_type as 'property' | 'special',
              row.item_id as string
            );

            console.log('📲 Checklist update:', key, row.checked);

            setTaskChecklistProgress((prev) => ({
              ...prev,
              [key]: { checked: row.checked ?? false },
            }));
          }
        )
        .subscribe();

    // 🧹 Clean up both subscriptions
    return () => {
      checklistSub?.unsubscribe();
      subscription?.unsubscribe();
    };
  }, []);

  const COLS = [
    { key: 'priority', label: 'Priority', width: 60 },
    { key: 'client',   label: 'Client',   width: 120 },
    { key: 'property', label: 'Property', width: 220 },
    { key: 'tag',      label: 'TAG',      width: 80 },
    { key: 'started',  label: 'Started',  width: 90 },
    { key: 'finished', label: 'Finished', width: 90 },
    { key: 'cleaners', label: 'Cleaners', width: 180 },
    { key: 'special',  label: 'Special Requirements', width: 260 },
    { key: 'Property Specifics',  label: 'Property Specifics',  width: 260 },
    { key: 'status',   label: 'Status',   width: 100 },
    { key: 'issues',   label: 'Issues',   width: 130 },
    { key: 'notes',    label: 'Notes',    width: 180 },
    { key: 'photos',   label: 'Photos',   width: 70 },
    { key: 'actions',  label: 'Actions',  width: 90 },
  ] as const;

  const TOTAL_TABLE_WIDTH = COLS.reduce((sum, c) => sum + c.width, 0);

  const renderColGroup = () => (
    <colgroup>
      {COLS.map((c, i) => (
        <col key={i} style={{ width: `${c.width}px` }} />
      ))}
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
                <div key={date} className="overflow-x-auto rounded-lg ring-1 ring-slate-200 shadow-sm bg-white">

                <details open>
                <summary className="flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-700 cursor-pointer select-none -mb-px">
                  <span>
                    {new Date(date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-xs text-slate-500">{tasksForDate.length} tasks</span>
                </summary>
                  <div className="overflow-x-auto bg-white">
                    <table
                      className="table-fixed w-full divide-y divide-slate-200 border-t border-slate-200
                                [&_th]:py-0 [&_th]:text-slate-600
                                [&_td]:!py-0 [&_td]:leading-6 [&_td:not(.va-middle)]:align-top"
                      style={{ minWidth: `${TOTAL_TABLE_WIDTH}px` }}
                    >
                      {renderColGroup()}
                      <thead className="sticky top-0 z-10 bg-slate-50">

                        <tr>
                        <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase
                                      sticky left-0 z-20 bg-slate-50">
                          Priority
                        </th>

                        <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase
                                      sticky left-[60px] z-20 bg-slate-50">
                          Client
                        </th>

                        <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase
                                      sticky left-[180px] z-20 bg-slate-50">
                          Property
                        </th>
                          <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase">TAG</th>
                          <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase">Started</th>
                          <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase">Finished</th>
                          <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase">Cleaners</th>
                          <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase">Special Requirements</th>
                          <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase">Property Specifics</th>
                          <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase">Issues</th>
                          <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase">Notes</th>
                          <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase">Photos</th>
                          <th className="px-4 py-0 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {tasksForDate.map((task) => (
                          <tr key={task.task_id} className="even:bg-white odd:bg-slate-50 hover:bg-slate-100">
                            <td className="px-4 py-1 text-sm text-gray-700 whitespace-nowrap
                                          sticky left-0 z-10 bg-inherit">
                              {task.priority_tag === 'Departure Clean' ? '' : task.priority_tag}
                            </td>

                            <td className="px-4 py-1 text-sm text-gray-700 max-w-[200px] overflow-hidden truncate
                                          sticky left-[60px] z-10 bg-inherit">
                              {task.client_display_name}
                            </td>

                            <td className="px-4 py-1 text-sm text-gray-700
                                          sticky left-[180px] z-10 bg-inherit">
                              <div className="flex items-center gap-2 min-w-0">
                              {task.city_short_name && (
                                <span
                                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-inset ring-slate-200 shrink-0"
                                  style={{ backgroundColor: getCityBadgeColor(task) }}
                                >
                                  {task.city_short_name}
                                </span>
                              )}
                                <span
                                  className="text-sm text-gray-900 font-medium truncate"
                                  title={`${task.short_address}${task.client_property_nickname ? ` - ${task.client_property_nickname}` : ''}`}
                                >
                                  {task.short_address}
                                  {task.client_property_nickname ? ` - ${task.client_property_nickname}` : ''}
                                </span>
                              </div>
                            </td>
                            <td className="px-1 py-0 text-sm text-gray-700 max-w-[200px] va-middle align-middle whitespace-nowrap">
                              <span className="inline-flex h-5 items-center rounded-full border border-slate-200 bg-slate-50 px-2 text-[8px] font-medium text-slate-700 leading-none">
                                {task.task_type_name}
                              </span>
                            </td>
                            <td className="px-4 py-1 text-sm text-gray-700 whitespace-nowrap text-center">
                              {task.started_at ? (
                                <div className="leading-tight">
                                  {new Date(task.started_at).toLocaleTimeString('en-AU', { hour12: false })}
                                  <br />
                                  {(() => {
                                    const date = new Date(task.started_at);
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const year = String(date.getFullYear()).slice(-2);
                                    return `${day}/${month}/${year}`;
                                  })()}
                                </div>
                              ) : (
                                <button
                                  onClick={async () => {
                                    const { error } = await supabase
                                      .from('cleaning_tasks')
                                      .update({ started_at: new Date().toISOString() })
                                      .eq('id', task.task_id);

                                    if (!error) {
                                      setTasks((prev) => {
                                        const updated = prev.map((t) =>
                                          t.task_id === task.task_id
                                            ? { ...t, started_at: new Date().toISOString() }
                                            : t
                                        );

                                        const newGrouped = new Map<string, EnrichedOperationsTask[]>();
                                        updated.forEach((t) => {
                                          if (!newGrouped.has(t.scheduled_date)) newGrouped.set(t.scheduled_date, []);
                                          newGrouped.get(t.scheduled_date)!.push(t);
                                        });

                                        setGroupedTasks(newGrouped);
                                        return updated;
                                      });
                                    } else {
                                      alert('Could not start task');
                                      console.error('Start error:', error.message);
                                    }
                                  }}
                                  title="Mark task as started"
                                  className="p-1 rounded hover:bg-green-100"
                                >
                                  <PlayIcon className="h-4 w-4 text-green-600" />
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-1 text-sm text-gray-700 whitespace-nowrap text-center">
                              {task.finished_at ? (
                                <div className="leading-tight">
                                  {new Date(task.finished_at).toLocaleTimeString('en-AU', { hour12: false })}
                                  <br />
                                  {(() => {
                                    const date = new Date(task.finished_at);
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const year = String(date.getFullYear()).slice(-2);
                                    return `${day}/${month}/${year}`;
                                  })()}
                                </div>
                              ) : (
                                <button
                                  onClick={async () => {
                                    const now = new Date().toISOString();

                                    const updateFields: Record<string, string> = { finished_at: now };
                                    if (!task.started_at) {
                                      updateFields.started_at = now;
                                    }

                                    const { error } = await supabase
                                      .from('cleaning_tasks')
                                      .update(updateFields)
                                      .eq('id', task.task_id);

                                    if (!error) {
                                      setTasks((prev) => {
                                        const updated = prev.map((t) =>
                                          t.task_id === task.task_id
                                            ? {
                                                ...t,
                                                finished_at: now,
                                                started_at: t.started_at || now,
                                              }
                                            : t
                                        );

                                        const newGrouped = new Map<string, EnrichedOperationsTask[]>();
                                        updated.forEach((t) => {
                                          if (!newGrouped.has(t.scheduled_date)) newGrouped.set(t.scheduled_date, []);
                                          newGrouped.get(t.scheduled_date)!.push(t);
                                        });

                                        setGroupedTasks(newGrouped);
                                        return updated;
                                      });
                                    } else {
                                      alert('Could not mark task as finished');
                                      console.error('Finish error:', error.message);
                                    }
                                  }}
                                  title="Mark task as finished"
                                  className="p-1 rounded hover:bg-green-100"
                                >
                                  <StopIcon className="h-4 w-4 text-red-600" />
                                </button>
                              )}
                            </td>
                            <td className="px-4 py-1 text-sm text-gray-700">
                              {(() => {
                                const cleanersArr = extractCleanersFromTask(task);
                                const assigned = cleanersArr.filter(c => c.id);
                                const emptySlots = cleanersArr.filter(c => !c.id);

                                // Render all assigned cleaners
                                return (
                                  <>
                                    {assigned.map(cleaner => (
                                      <div key={cleaner.slotIndex} className="flex items-center gap-1 min-w-0">
                                        {editingCleaner?.taskId === task.task_id && editingCleaner.index === cleaner.slotIndex ? (
                                          <select
                                            value={cleaner.id || ''}
                                            onChange={async (e) => {
                                              const cleanerId = e.target.value ? Number(e.target.value) : null;
                                              const idField = `cleaner${cleaner.slotIndex}_id`;
                                              const nameField = `cleaner${cleaner.slotIndex}_name`;

                                              const { error } = await supabase
                                                .from('cleaning_tasks')
                                                .update({ [idField]: cleanerId })
                                                .eq('id', task.task_id);

                                              if (!error) {
                                                setTasks((prev) => {
                                                  const updated = prev.map((t) =>
                                                    t.task_id === task.task_id
                                                      ? {
                                                          ...t,
                                                          [idField]: cleanerId,
                                                          [nameField]: allCleaners.find((c) => c.id === cleanerId)?.display_name ?? null,
                                                        }
                                                      : t
                                                  );
                                                  const newGrouped = new Map<string, EnrichedOperationsTask[]>();
                                                  updated.forEach((t) => {
                                                    if (!newGrouped.has(t.scheduled_date)) newGrouped.set(t.scheduled_date, []);
                                                    newGrouped.get(t.scheduled_date)!.push(t);
                                                  });
                                                  setGroupedTasks(newGrouped);
                                                  return updated;
                                                });
                                              }
                                              setEditingCleaner(null);
                                            }}
                                            onBlur={() => setEditingCleaner(null)}
                                            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                          >
                                            <option value="">Unassigned</option>
                                            {allCleaners.map((c) => (
                                              <option key={c.id} value={c.id}>{c.display_name}</option>
                                            ))}
                                          </select>
                                        ) : (
                                          <>
                                            <span className="flex-1 min-w-0 truncate" title={cleaner.name}>
                                              {cleaner.name}
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <button
                                                className="p-1 rounded-md hover:bg-slate-100"
                                                onClick={() => setEditingCleaner({ taskId: task.task_id, index: cleaner.slotIndex })}
                                              >
                                                <PencilIcon className="h-4 w-4 text-slate-500 hover:text-slate-700" />
                                              </button>
                                              <button
                                                className="p-1 rounded-md hover:bg-slate-100"
                                                onClick={async () => {
                                                  const idField = `cleaner${cleaner.slotIndex}_id`;
                                                  const nameField = `cleaner${cleaner.slotIndex}_name`;
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
                                                      const newGrouped = new Map<string, EnrichedOperationsTask[]>();
                                                      updated.forEach((t) => {
                                                        if (!newGrouped.has(t.scheduled_date)) newGrouped.set(t.scheduled_date, []);
                                                        newGrouped.get(t.scheduled_date)!.push(t);
                                                      });
                                                      setGroupedTasks(newGrouped);
                                                      return updated;
                                                    });
                                                  }
                                                }}
                                              >
                                                <XMarkIcon className="h-4 w-4 text-slate-500 hover:text-rose-600" />
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}

                                    {/* Show only one plus button if slots are available */}
                                    {emptySlots.length > 0 && (() => {
                                      const target = emptySlots[0]; // first empty slot
                                      const idField = `cleaner${target.slotIndex}_id`;
                                      const nameField = `cleaner${target.slotIndex}_name`;

                                      const isEditingEmpty = (
                                        editingCleaner?.taskId === task.task_id &&
                                        editingCleaner.index === target.slotIndex
                                      );

                                      return (
                                        <div key="add-cleaner" className="flex items-center gap-1">
                                          {isEditingEmpty ? (
                                            <select
                                              value={''}
                                              onChange={async (e) => {
                                                const cleanerId = e.target.value ? Number(e.target.value) : null;

                                                const { error } = await supabase
                                                  .from('cleaning_tasks')
                                                  .update({ [idField]: cleanerId })
                                                  .eq('id', task.task_id);

                                                if (!error) {
                                                  setTasks((prev) => {
                                                    const updated = prev.map((t) =>
                                                      t.task_id === task.task_id
                                                        ? {
                                                            ...t,
                                                            [idField]: cleanerId,
                                                            [nameField]:
                                                              allCleaners.find((c) => c.id === cleanerId)?.display_name ?? null,
                                                          }
                                                        : t
                                                    );
                                                    const newGrouped = new Map<string, EnrichedOperationsTask[]>();
                                                    updated.forEach((t) => {
                                                      if (!newGrouped.has(t.scheduled_date)) newGrouped.set(t.scheduled_date, []);
                                                      newGrouped.get(t.scheduled_date)!.push(t);
                                                    });
                                                    setGroupedTasks(newGrouped);
                                                    return updated;
                                                  });
                                                } else {
                                                  alert('Could not assign cleaner.');
                                                  console.error('Error updating cleaner:', error.message);
                                                }
                                                setEditingCleaner(null);
                                              }}
                                              onBlur={() => setEditingCleaner(null)}
                                              className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              autoFocus
                                            >
                                              <option value="">Select cleaner…</option>
                                              {allCleaners.map((c) => (
                                                <option key={c.id} value={c.id}>{c.display_name}</option>
                                              ))}
                                            </select>
                                          ) : (
                                            <button
                                              className="p-1 rounded-md hover:bg-gray-100"
                                              onClick={() =>
                                                setEditingCleaner({ taskId: task.task_id, index: target.slotIndex })
                                              }
                                              title="Add cleaner"
                                            >
                                              <PlusIcon className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-1 text-sm text-gray-700">
                              {task.special_requirements_items && task.special_requirements_items.length > 0 ? (
                                <ul className="space-y-1">
                                  {task.special_requirements_items.map((item) => {
                                    const key = makeProgressKey(task.task_id, 'special', item.item_id);

                                    return (
                                      <li key={item.item_id} className="flex items-center gap-2 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={taskChecklistProgress?.[key]?.checked ?? false}
                                          onChange={async (e) => {
                                            const checked = e.target.checked;

                                            const { error } = await supabase
                                              .from('task_checklist_progress')
                                              .upsert(
                                                {
                                                  task_id: task.task_id,
                                                  cleaner_id: null,
                                                  user_id: user?.id ?? null,
                                                  item_type: 'special',
                                                  item_id: item.item_id,
                                                  checked,
                                                },
                                                { onConflict: 'task_id,item_type,item_id' }
                                              );

                                            if (!error) {
                                              setTaskChecklistProgress((prev) => ({
                                                ...prev,
                                                [key]: { checked },
                                              }));
                                            } else {
                                              alert('Error saving checklist status');
                                              console.error(error);
                                            }
                                          }}
                                          className="form-checkbox h-4 w-4 text-blue-600"
                                        />
                                          <span className="text-xs flex-1 truncate" title={item.description}>
                                            {item.description}
                                          </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <span className="text-slate-400 italic text-center">—</span>
                              )}
                            </td>
                            <td className="px-4 py-1 text-sm text-gray-700">
                              {task.property_specifics_items && task.property_specifics_items.length > 0 ? (
                                <ul className="space-y-1">
                                  {task.property_specifics_items.map((item) => {
                                    const key = makeProgressKey(task.task_id, 'property', item.item_id);

                                    return (
                                      <li key={item.item_id} className="flex items-center gap-2 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={taskChecklistProgress?.[key]?.checked ?? false}
                                          onChange={async (e) => {
                                            const checked = e.target.checked;

                                            const { error } = await supabase
                                              .from('task_checklist_progress')
                                              .upsert({
                                                task_id: task.task_id,
                                                cleaner_id: null,
                                                user_id: user?.id ?? null,
                                                item_type: 'property',
                                                item_id: item.item_id,
                                                checked,
                                              }, {
                                                onConflict: 'task_id,item_type,item_id'
                                              });

                                            if (!error) {
                                              setTaskChecklistProgress((prev) => ({
                                                ...prev,
                                                [key]: { checked },
                                              }));
                                            } else {
                                              alert('Error saving checklist status');
                                              console.error(error);
                                            }
                                          }}
                                          className="form-checkbox h-4 w-4 text-blue-600"
                                        />
                                        <span className="text-xs flex-1 truncate" title={item.description}>
                                          {item.description}
                                        </span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <span className="text-gray-400 italic text-center">—</span>
                              )}
                            </td>
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

                                        const newGrouped = new Map<string, EnrichedOperationsTask[]>();
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

                                        const newGrouped = new Map<string, EnrichedOperationsTask[]>();
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
                                    <span className="text-slate-400 italic">No notes</span>
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
                                <span className="text-slate-400 italic">—</span>
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
