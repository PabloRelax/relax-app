// src/app/cleaner/home/page.tsx
'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase/client';
import Link from 'next/link';
import moment from 'moment';
import type { Tables } from 'types/supabase';

type CleaningTaskWithJoins = Tables<'cleaning_tasks'> & {
  properties: Pick<Tables<'properties'>, 'short_address' | 'client_property_nickname'> | null;
  task_types: { name: string } | null;
};

export default function CleanerHomePage() {
  const [tasks, setTasks] = useState<CleaningTaskWithJoins[]>([]);
  const [loading, setLoading] = useState(true);

      useEffect(() => {
    async function loadTasks() {
        setLoading(true);

        // Step 1: Get logged-in user
        const { data: { session }, error: userError } = await supabase.auth.getSession();

        if (userError || !session || !session.user) {
          console.error('No user found or auth error:', userError);
          setLoading(false);
          return;
        }

        const user = session.user;

        if (userError || !user) {
        console.error('No user found or auth error:', userError);
        setLoading(false);
        return;
        }

        // Step 2: Find the cleaner linked to this user
        const { data: cleaner, error: cleanerError } = await supabase
        .from('cleaners')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

        if (cleanerError || !cleaner) {
        console.error('No cleaner record found for this user:', cleanerError);
        setLoading(false);
        return;
        }

        const cleanerId = cleaner.id;

        // Step 3: Fetch tasks assigned to this cleaner
        const { data, error } = await supabase
        .from('cleaning_tasks')
        .select(`*, properties(short_address, client_property_nickname), task_types(name)`)
        .or(
            `cleaner1_id.eq.${cleanerId},cleaner2_id.eq.${cleanerId},cleaner3_id.eq.${cleanerId}`
        )
        .order('scheduled_date', { ascending: true });

        if (error) {
        console.error('❌ Supabase error:', error);
        } else {
        console.log('✅ Loaded cleaner tasks:', data);
        setTasks(data ?? []);
        }

        setLoading(false);
    }

    loadTasks();
    }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">My Upcoming Tasks</h1>

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No upcoming tasks.</p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Link key={task.id} href={`/cleaner/task/${task.id}`}>
              <div className="bg-white p-4 rounded shadow border cursor-pointer hover:bg-gray-50">
                <div className="text-sm font-medium text-gray-600">
                  {task.properties?.client_property_nickname || task.properties?.short_address}
                </div>
                <div className="text-xs text-gray-500">{moment(task.scheduled_date).format('dddd, MMM D')}</div>
                <div className="mt-1 text-sm text-blue-800 font-semibold">
                  {task.task_types?.name || 'Clean'} {task.priority_tag ? `– ${task.priority_tag}` : ''}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
