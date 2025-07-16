// relax-app\src\app\multiview\page.tsx

'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from 'types/supabase';
import DashboardLayout from '../../components/DashboardLayout';
import moment from 'moment';
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import type { PropertyWithClient } from '@/generated-types/customTypes';

type Reservation = Database['public']['Tables']['reservations']['Row'];

type TaskWithType = Database['public']['Tables']['cleaning_tasks']['Row'] & {
  task_types: { name: string } | null;
};

const supabase = createClientComponentClient<Database>();
const getBrisbaneDate = (dateString: string) => {
  return moment(dateString).utcOffset(10 * 60); // +10 hours for Brisbane
};

export default function MultiViewPage() {
  const [properties, setProperties] = useState<PropertyWithClient[]>([]);
  const [search, setSearch] = useState('');
  const [currentStartDate, setCurrentStartDate] = useState(moment().subtract(1, 'day'));
  const currentEndDate = moment(currentStartDate).add(6, 'days');
  const dateRange = Array.from({ length: 7 }).map((_, i) => moment(currentStartDate).add(i, 'days'));
  const fetchStartDate = moment(currentStartDate).subtract(14, 'days').format('YYYY-MM-DD'); // 2 weeks before
  const fetchEndDate = moment(currentEndDate).add(2, 'months').format('YYYY-MM-DD'); // 2 months after
  const today = moment().format('YYYY-MM-DD');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tasks, setTasks] = useState<TaskWithType[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

  const [{ data: props }, { data: res }, { data: tsk }] = await Promise.all([
    supabase
      .from('properties')
      .select('*, clients(display_name), property_icals(url), property_service_types(name), cities(name), suburbs(name)')
      .eq('platform_user_id', userData.user.id)
      .eq('status', 'active'),
    supabase
      .from('reservations')
      .select('*')
      .eq('platform_user_id', userData.user.id)
      .or(`and(start_date.lte.${fetchEndDate},end_date.gte.${fetchStartDate})`),
    supabase.from('cleaning_tasks').select('*, task_types(name)').eq('platform_user_id', userData.user.id),
  ]);

  console.log('Reservations fetched (filtered):', res?.length);
  console.log('Total reservations fetched:', res?.length);

  setProperties(props || []);
  setReservations(res || []);
  setTasks(tsk || []);
    }
    loadData();
      console.log("Debug Data:", {
    properties: properties.map(p => ({ id: p.id, name: p.short_address })),
    reservations: reservations.map(r => ({
      id: r.id,
      property_id: r.property_id,
      start: r.start_date,
      end: r.end_date,
      brisbaneStart: getBrisbaneDate(r.start_date).format(),
      brisbaneEnd: getBrisbaneDate(r.end_date).format()
    })),
    dateRange: dateRange.map(d => d.format())
  });

  }, [dateRange, fetchEndDate, fetchStartDate, properties, reservations]);

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
                      <div className={
                        prop.property_icals?.length > 0 && 
                        prop.property_icals[0]?.url
                          ? ''
                          : 'bg-red-100 text-gray-800 p-1 rounded'
                      }>
                        {[prop.clients?.display_name, prop.short_address, prop.client_property_nickname]
                          .filter(Boolean)
                          .join(' – ') || 'Unnamed'}
                      </div>
                    </td>
                    {dateRange.map(date => {
                      const reservationsForDay = reservations.filter(r => {
                        if (r.property_id !== prop.id) return false;

                        const start = getBrisbaneDate(r.start_date);
                        const end = getBrisbaneDate(r.end_date);

                        return date.isBetween(start, end, 'day', '[]'); // Inclusive range
                      });

                      const taskToday = tasks.find(t => t.property_id === prop.id && moment(t.scheduled_date).isSame(date, 'day'));

                      return (
                        <td key={date.toString()} className="p-0 border border-gray-300 text-center text-xs w-20 align-top">
                          {/* Group reservations */}
                          {(() => {
                            const checkIns = reservationsForDay.filter(r =>
                              date.isSame(getBrisbaneDate(r.start_date), 'day')
                            );
                            const checkOuts = reservationsForDay.filter(r =>
                              date.isSame(getBrisbaneDate(r.end_date), 'day')
                            );
                            const guestDays = reservationsForDay.filter(r =>
                              !date.isSame(getBrisbaneDate(r.start_date), 'day') &&
                              !date.isSame(getBrisbaneDate(r.end_date), 'day')
                            );

                            return (
                              <>
                                {/* Side-by-side CO and CI */}
                                {checkIns.length > 0 && checkOuts.length > 0 && (
                                  <div className="flex flex-row justify-between gap-1 mb-1">
                                    {checkOuts.map(r => (
                                      <div key={`co-${r.id}`} className="bg-blue-100 text-blue-800 rounded px-1 py-0.5 text-[11px] w-1/3 text-center">
                                        CO
                                      </div>
                                    ))}
                                    {checkIns.map(r => (
                                      <div key={`ci-${r.id}`} className="bg-blue-100 text-blue-800 rounded px-1 py-0.5 text-[11px] w-1/3 text-center">
                                        CI
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {checkOuts.length > 0 && checkIns.length === 0 && (
                                  <div className="flex justify-start mb-1">
                                    {checkOuts.map(r => (
                                      <div key={`co-${r.id}`} className="bg-blue-100 text-blue-800 rounded px-1 py-0.5 text-[11px] w-1/3 text-center">
                                        CO
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {checkIns.length > 0 && checkOuts.length === 0 && (
                                  <div className="flex justify-end mb-1">
                                    {checkIns.map(r => (
                                      <div key={`ci-${r.id}`} className="bg-blue-100 text-blue-800 rounded px-1 py-0.5 text-[11px] w-1/3 text-center">
                                        CI
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Guest (middle) days */}
                                {guestDays.map(r => (
                                  <div
                                    key={`guest-${r.id}`}
                                    className="bg-blue-100 text-blue-800 rounded w-full px-0 py-0.5 text-[11px] mb-1"
                                  >
                                    Guest
                                  </div>
                                ))}
                              </>
                            );
                          })()}

                          {/* Cleaning task (unchanged) */}
                          {taskToday && (
                            <div className="bg-yellow-100 text-yellow-800 rounded mt-1 px-1 py-0.5 text-[11px]">
                              🧹 {taskToday.task_types?.name === 'Clean'
                                ? `Clean – ${taskToday.priority_tag || 'N/A'}`
                                : taskToday.task_types?.name ?? 'Other'}
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
