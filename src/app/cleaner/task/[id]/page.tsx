// src/app/cleaner/task/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from 'types/supabase';
import moment from 'moment';

const supabase = createClientComponentClient<Database>();

export default function TaskDetailPage() {
  const { id } = useParams();
  const [task, setTask] = useState<any>(null);
  const [starting, setStarting] = useState(false);

    useEffect(() => {
    async function fetchTask() {
        const taskId = Number(id); // 🔧 Fix type
        if (!taskId) return;

        const { data, error } = await supabase
        .from('cleaning_tasks')
        .select(`*, properties(*), task_types(name)`)
        .eq('id', taskId)
        .single();

        if (error) console.error(error);
        else setTask(data);
    }

    fetchTask();
    }, [id]);

    async function handleStartTask() {
      if (!task || task.started_at) return;

      setStarting(true);

      const { error } = await supabase
        .from('cleaning_tasks')
        .update({ started_at: new Date().toISOString() })
        .eq('id', task.id);

      if (error) {
        console.error('Failed to start task:', error);
      } else {
        setTask({ ...task, started_at: new Date().toISOString() });
      }

      setStarting(false);
    }

    async function handleCompleteTask() {
      if (!task || task.finished_at) return;

      setStarting(true);

      const { error } = await supabase
        .from('cleaning_tasks')
        .update({ finished_at: new Date().toISOString() })
        .eq('id', task.id);

      if (error) {
        console.error('Failed to complete task:', error);
      } else {
        setTask({ ...task, finished_at: new Date().toISOString() });
      }

      setStarting(false);
    }

  if (!task) return <div className="p-4">Loading...</div>;

  const property = task.properties;
  const taskType = task.task_types?.name || 'Clean';

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold text-blue-800">
        {property?.client_property_nickname || property?.short_address}
      </h2>

      <p className="text-sm text-gray-700">
        <span className="font-medium">Task:</span> {taskType}
        {task.priority_tag ? ` – ${task.priority_tag}` : ''}
      </p>

      <p className="text-sm text-gray-700">
        <span className="font-medium">Due:</span>{' '}
        {moment(task.scheduled_date).format('dddd, MMMM Do')}
      </p>

      {task.special_request && (
        <div className="p-3 bg-yellow-100 text-yellow-800 text-sm rounded border">
          <strong>Special Request:</strong> {task.special_request}
        </div>
      )}

      <details className="border rounded p-2 text-sm text-gray-800">
        <summary className="font-medium cursor-pointer">🔑 Access Info</summary>
        <div className="mt-2 space-y-1">
          <div><strong>Keys:</strong> {property?.hsk_key_tag}</div>
          <div><strong>Access:</strong> {property?.access_info}</div>
          <div><strong>Parking:</strong> {property?.parking_info}</div>
        </div>
      </details>

      {task.started_at ? (
        <div className="text-green-700 font-medium text-sm">
          ✅ Task started at {moment(task.started_at).format('h:mm A')}
        </div>
      ) : (
        <button
          className="w-full bg-green-600 text-white py-2 rounded mt-4 disabled:opacity-50"
          onClick={handleStartTask}
          disabled={starting}
        >
          {starting ? 'Starting...' : 'Start Task'}
        </button>
      )}
      {task.finished_at ? (
        <div className="text-blue-700 font-medium text-sm">
          🏁 Task completed at {moment(task.finished_at).format('h:mm A')}
        </div>
      ) : task.started_at ? (
        <button
          className="w-full bg-blue-600 text-white py-2 rounded mt-2 disabled:opacity-50"
          onClick={handleCompleteTask}
          disabled={starting}
        >
          {starting ? 'Finishing...' : 'Complete Task'}
        </button>
      ) : null}
    </div>
  );
}
