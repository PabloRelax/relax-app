// relax-app\src\app\multiview\page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from 'types/supabase';
import DashboardLayout from '../../components/DashboardLayout';
import moment from 'moment';
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';

const supabase = createClientComponentClient<Database>();
const getBrisbaneDate = (dateString: string) => {
  return moment(dateString).utcOffset(10 * 60); // +10 hours for Brisbane
};

export default function MultiViewPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentStartDate, setCurrentStartDate] = useState(moment().subtract(1, 'day'));

  const currentEndDate = moment(currentStartDate).add(6, 'days');
  const dateRange = Array.from({ length: 7 }).map((_, i) => moment(currentStartDate).add(i, 'days'));
  const today = moment().format('YYYY-MM-DD');

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const [{ data: props }, { data: res }, { data: tsk }] = await Promise.all([
        supabase.from('properties').select('*, clients(display_name)').eq('platform_user_id', userData.user.id).eq('status', 'active'),
        supabase.from('reservations').select('*').eq('platform_user_id', userData.user.id),
        supabase.from('cleaning_tasks').select('*').eq('platform_user_id', userData.user.id),
      ]);

      setProperties(props || []);
      setReservations(res || []);
      setTasks(tsk || []);
    }
    loadData();
  }, []);

  const filteredProperties = properties.filter((p) => {
    const searchLower = search.toLowerCase();

    return (
      p.short_address?.toLowerCase().includes(searchLower) ||
      p.client_property_nickname?.toLowerCase().includes(searchLower) ||
      p.clients?.display_name?.toLowerCase().includes(searchLower)
    );
  });


  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 items-center">
            <button
              type = "button"
              onClick={() => setCurrentStartDate(prev => moment(prev).subtract(7, 'days'))}
              className="p-2 border rounded hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type = "button"
              onClick={() => setCurrentStartDate(moment().subtract(1, 'day'))}
              className="p-2 border rounded hover:bg-gray-100"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
            <button
              type = "button"  
              onClick={() => setCurrentStartDate(prev => moment(prev).add(7, 'days'))}
              className="p-2 border rounded hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="ml-4 text-sm text-gray-700 font-medium">
              {currentStartDate.format('ddd, MMM D')} → {currentEndDate.format('ddd, MMM D')}
            </span>
          </div>
          <input
            type="text"
            placeholder="Search by property name or address..."
            className="border px-3 py-2 rounded w-80"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-gray-300 border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2 border w-56">Property</th>
                {dateRange.map((date, idx) => {
                  const isToday = date.format('YYYY-MM-DD') === today;
                  return (
                    <th
                      key={date.toString()}
                      className={`text-center p-2 border w-20 ${
                        isToday ? 'bg-blue-100 font-bold' : idx % 2 === 0 ? 'bg-yellow-50' : 'bg-white'
                      }`}
                    >
                      {date.format('ddd D')}
                    </th>
                  );
                })}
              </tr>
            </thead>
              <tbody>
                {filteredProperties.map(prop => (
                  <tr key={prop.id} className="align-top">
                    <td className="p-3 border border-gray-300 text-sm font-medium whitespace-nowrap align-top w-56">
                      <div className={!prop.ical ? 'line-through text-gray-500' : ''}>
                        {[prop.clients?.display_name, prop.short_address, prop.client_property_nickname].filter(Boolean).join(' – ') || 'Unnamed'}
                      </div>
                    </td>
                    {dateRange.map(date => {
                      const reservation = reservations.find(r => 
                        r.property_id === prop.id && 
                        (date.isSameOrAfter(moment(r.start_date), 'day') && 
                        date.isSameOrBefore(moment(r.end_date), 'day'))
                      );
                      
                      const isCheckoutDay = reservation && 
                        date.isSame(getBrisbaneDate(reservation.end_date), 'day');
                      const isCheckinDay = reservation && 
                        date.isSame(getBrisbaneDate(reservation.start_date), 'day');
                      const taskToday = tasks.find(t => t.property_id === prop.id && moment(t.scheduled_date).isSame(date, 'day'));

                      return (
                        <td key={date.toString()} className="p-2 border border-gray-300 text-center text-xs w-20 align-top">
                          {reservation && (
                            <div className={`
                              ${isCheckoutDay ? 'bg-blue-100 w-1/3 mr-auto' : 
                              isCheckinDay ? 'bg-blue-100 w-1/3 ml-auto' : 'bg-blue-100'} 
                              text-blue-800 rounded px-1 py-0.5 text-[11px]
                            `}>
                              {isCheckoutDay ? 'CO' : 
                              isCheckinDay ? 'CI' : 'Guest'}
                            </div>
                          )}
                          {taskToday && (
                            <div className="bg-yellow-100 text-yellow-800 rounded mt-1 px-1 py-0.5 text-[11px]">
                              🧹 {taskToday.task_type === 'Clean' 
                                ? `Clean – ${taskToday.priority_tag || 'N/A'}` 
                                : taskToday.task_type}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
