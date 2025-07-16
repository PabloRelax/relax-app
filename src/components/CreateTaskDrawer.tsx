// components/CreateTaskDrawer.tsx
'use client';

import { useState, useEffect } from 'react';
import type { PropertyWithClient } from '../generated-types/customTypes';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from 'types/supabase';
import type { TablesInsert } from 'types/supabase';

type TaskType = Database['public']['Tables']['task_types']['Row'];

interface CreateTaskDrawerProps {
  defaultProperty?: PropertyWithClient | null;
  allProperties?: PropertyWithClient[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}

export default function CreateTaskDrawer({
  defaultProperty = null,
  allProperties = [],
  onClose,
  onCreated
}: CreateTaskDrawerProps) {
  const [property, setProperty] = useState<PropertyWithClient | null>(defaultProperty);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(new Date());
  const [notes, setNotes] = useState('');
  const [priorityTag, setPriorityTag] = useState('Departure Clean');
  const showPropertySelector = true;
  const supabase = createClientComponentClient<Database>();
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [taskTypeId, setTaskTypeId] = useState<string | null>(null);

  useEffect(() => {
    async function loadTaskTypes() {
      const { data, error } = await supabase.from('task_types').select('*').order('name');
      if (error) {
        console.error('Failed to load task types:', error.message);
      } else {
        setTaskTypes(data || []);
      }
    }
    loadTaskTypes();
   }, [supabase]);
  
  const handleCreateTask = async () => {
    if (!property) {
      alert('Please select a property before creating the task.');
      return;
    }

    if (!taskTypeId) {
      alert('Please select a task type before submitting.');
      return;
    }
    
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) {
      alert('User not authenticated.');
      return;
    }

  const { error } = await supabase
    .from('cleaning_tasks')
    .insert<TablesInsert<'cleaning_tasks'>>([{
      platform_user_id: userId,
      property_id: property.id,
      scheduled_date: scheduledDate?.toISOString().slice(0, 10) ?? '',
      task_type_id: taskTypeId,
      priority_tag: taskTypes.find(t => t.id === taskTypeId)?.name === 'Clean' ? priorityTag : null,
      notes,
    }]);

    if (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task.');
      return;
    }

    await onCreated();
  };

  return (
    <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-lg p-6 overflow-y-auto z-50">
      <h2 className="text-xl font-bold mb-4">Create New Task</h2>

      {showPropertySelector && allProperties && (
        <select
          value={property?.id ?? ''}
          onChange={(e) => {
            const selected = allProperties.find(p => p.id === Number(e.target.value));
            setProperty(selected || null);
          }}
          className="w-full border px-3 py-2 rounded mb-4"
        >
          <option value="">Select Property</option>
          {allProperties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.client_property_nickname || p.short_address} — {p.clients?.display_name}
            </option>
          ))}
        </select>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
        <DatePicker
          selected={scheduledDate}
          onChange={date => setScheduledDate(date)}
          className="w-full border px-3 py-2 rounded"
          dateFormat="yyyy-MM-dd"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
          <select
            value={taskTypeId ?? ''}
            onChange={(e) => setTaskTypeId(e.target.value || null)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">Select task type</option>
            {taskTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
      </div>

      {taskTypes.find(t => t.id === taskTypeId)?.name === 'Clean' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority Tag</label>
          <select
            value={priorityTag}
            onChange={(e) => setPriorityTag(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            {['Departure Clean', 'B2B', 'Deferred'].map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes"
        className="w-full border px-3 py-2 rounded mb-4"
      />

      <div className="flex justify-between">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateTask}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Task
        </button>
      </div>
    </div>
  );
}
