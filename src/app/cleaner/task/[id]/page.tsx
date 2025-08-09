// src/app/cleaner/task/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import supabase from '@/lib/supabase/client';
import type { Tables } from 'types/supabase';
import moment from 'moment';

export default function TaskDetailPage() {
  const { id } = useParams();
  const [starting, setStarting] = useState(false);
  const [task, setTask] = useState<Tables<'cleaning_tasks'> & {
    properties: Tables<'properties'>;
    task_types: { name: string } | null;
  } | null>(null);

    useEffect(() => {
    async function fetchTask() {
        const taskId = Number(id); // 🔧 Fix type
        if (!taskId) return;

        const { data, error } = await supabase
          .from('cleaning_tasks')
          .select('*')
          .eq('id', taskId)
          .maybeSingle();

        console.log('🔍 Fetch without joins:', { data, error });

        console.log('🔍 Basic fetch result:', { data, error });

        if (error) {
          console.error('❌ Failed to fetch task:', {
            error,
            taskId,
            userId: (await supabase.auth.getUser()).data.user?.id,
          });
        }
        else setTask(data as any); // temporarily silence the TS warning for debug
    }

    fetchTask();
    }, [id]);

    async function handleStartTask() {
      if (!task || task.started_at) return;

      setStarting(true);

      const { data, error } = await supabase
        .from('cleaning_tasks')
        .update({ started_at: new Date().toISOString() })
        .eq('id', task.id)
        .select();

      console.log('🛠️ Update result:', { data, error });

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
            <button
              className="w-full bg-gray-100 text-sm text-gray-800 py-2 rounded border mt-6"
              onClick={() => window.location.href = '/cleaner/home'}
            >
              ⬅ Go back to dashboard
            </button>
    </div>    
  );
}
