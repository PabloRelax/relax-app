// relax-app\src\app\multiview\page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
//import supabase from '@/lib/supabase/client';
import type { Database } from 'types/supabase';
import DashboardLayout from '../../components/DashboardLayout';
import moment from 'moment';
import { ChevronLeft, ChevronRight, RefreshCcw, Info } from 'lucide-react';
import type { PropertyWithClient } from '@/generated-types/customTypes';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase/client';
import { useMemo } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import PropertyDetailPanel from '@/components/PropertyDetailPanel';

type Reservation = Database['public']['Tables']['reservations']['Row'];

type TaskWithType = Database['public']['Tables']['cleaning_tasks']['Row'] & {
  task_types: { name: string } | null;
};

type DebugInfo = {
  timestamp: string;
  supabaseUrl: string | undefined;
  authCheck: 'init' | 'session_found' | 'no_session';
  sessionError?: AuthError | null;
  sessionUser?: User | null;
  catchError?: string;
};

const getBrisbaneDate = (dateString: string) => {
  return moment(dateString).utcOffset(10 * 60); // +10 hours for Brisbane
};

export default function MultiViewPage() {
  const [properties, setProperties] = useState<PropertyWithClient[]>([]);
  const [search, setSearch] = useState('');
  const [currentStartDate, setCurrentStartDate] = useState(moment().subtract(1, 'day'));
  const currentEndDate = moment(currentStartDate).add(6, 'days');
  const dateRange = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) =>
      moment(currentStartDate).add(i, 'days')
    );
  }, [currentStartDate]);
  //const dateRange = Array.from({ length: 7 }).map((_, i) => moment(currentStartDate).add(i, 'days'));
  const fetchStartDate = moment(currentStartDate).subtract(14, 'days').format('YYYY-MM-DD'); // 2 weeks before
  const fetchEndDate = moment(currentEndDate).add(30, 'day').format('YYYY-MM-DD'); // 30 day after, for testing
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null); // used in /debug
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null); // used in /debug
  const today = moment().format('YYYY-MM-DD');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tasks, setTasks] = useState<TaskWithType[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithClient | null>(null);
  const logEvent = (type: string, data?: Record<string, unknown>) => {

    const event = {
      timestamp: new Date().toISOString(),
      type,
      data
    };
    window.postMessage({
      type: 'MULTIVIEW_EVENT',
      payload: event
    }, '*');
  };

  const loadData = useCallback(async () => {
    logEvent('LOAD_DATA_STARTED');
    try {
      setLoading(true);
      setError(null);

      // 🔍 Properly typed debug data
      const debugData: DebugInfo = {
        timestamp: new Date().toISOString(),
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        authCheck: 'init'
      };

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

       // 🔍 Now TypeScript won't complain about these assignments
      debugData.authCheck = session ? 'session_found' : 'no_session';
      debugData.sessionError = sessionError;
      debugData.sessionUser = session?.user;
      setDebugInfo(debugData);
      
      if (sessionError || !session?.user) {
        console.error('Auth debug:', debugData); // 🔍 Log debug info on error
        setError('Authentication failed');
        router.push('/');
        return;
      }

      setUser(session.user); 
      const [
        { data: props, error: propsError, status: propsStatus },
        { data: res, error: resError, status: resStatus },
        { data: tsk, error: tskError, status: tskStatus }
      ] = await Promise.all([
        supabase
          .from('properties')
.select(`
  *,
  clients(display_name),
  property_icals(url),
  property_service_types(name),
  cities(name),
  suburbs(name),
  property_specifics_items(id, description, requires_photo)
`)

          .eq('platform_user_id', session.user.id)
          .eq('status', 'active'),
        supabase.from('reservations')
          .select('*')
          .eq('platform_user_id', session.user.id)
          .or(`and(start_date.lte.${fetchEndDate},end_date.gte.${fetchStartDate})`),
        supabase
          .from('cleaning_tasks')
          .select('*, task_types(name)')
          .eq('platform_user_id', session.user.id)
          .gte('scheduled_date', fetchStartDate)
          .lte('scheduled_date', fetchEndDate),
      ]);

      console.log('🧪 Supabase responses:', {
        props, propsError, propsStatus,
        res, resError, resStatus,
        tsk, tskError, tskStatus,
      });

      if (propsError || resError || tskError) {
        console.error('Data fetching errors:', { propsError, resError, tskError });
        setError('Failed to load some data');
        setProperties(props || []);
        setReservations(res || []);
        setTasks(tsk || []);
      } else {
        setProperties(props || []);
        setReservations(res || []);
        setTasks(tsk || []);
      }

      console.log("Debug Data:", {
        properties: props?.map(p => ({ id: p.id, name: p.short_address })) || [],
        reservations: res?.map(r => ({
          id: r.id,
          property_id: r.property_id,
          start: r.start_date,
          end: r.end_date,
          brisbaneStart: getBrisbaneDate(r.start_date).format(),
          brisbaneEnd: getBrisbaneDate(r.end_date).format()
        })) || [],
        dateRange: dateRange.map(d => d.format())
      });
      logEvent('LOAD_DATA_SUCCESS', { 
        properties: props?.length,
        reservations: res?.length
      });
    } catch (err) {
      logEvent('LOAD_DATA_ERROR', { 
        error: err instanceof Error ? err.message : String(err)
      });
      setDebugInfo(prev => ({
        ...prev,
        catchError: err instanceof Error ? err.message : 'Unknown error'
      } as DebugInfo)); // 🔍 Add type assertion here
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchEndDate, fetchStartDate, router, dateRange]); // Added dateRange to satisfy ESLint


  useEffect(() => {    
    logEvent('PAGE_LOADED');
    loadData();  // Calling the async function

  }, [loadData]);

  const filteredProperties = properties
    .filter((p) => {
      const searchLower = search.toLowerCase();
      return (
        p.short_address?.toLowerCase().includes(searchLower) ||
        p.client_property_nickname?.toLowerCase().includes(searchLower) ||
        p.clients?.display_name?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const hasIcal = (p: PropertyWithClient) =>
        p.property_icals?.length > 0 && !!p.property_icals[0]?.url;

      // false < true → properties WITH valid iCal come first
      return Number(!hasIcal(a)) - Number(!hasIcal(b));
    });

    return (
    <DashboardLayout>
      {selectedProperty && (
        <PropertyDetailPanel
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
        <div className="p-6">
          {process.env.NODE_ENV !== 'production' && (
            <div className="hidden">
              <p>User ID: {user?.id}</p>
              <p>Auth Check: {debugInfo?.authCheck}</p>
              <p>Error: {debugInfo?.catchError}</p>
            </div>
          )}
          {/* Error State - Shows when there's an error, regardless of loading state */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
              {error}
              <button 
                onClick={loadData}
                className="ml-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State - Only shows when loading AND we don't have data yet */}
          {loading && filteredProperties.length === 0 ? (
            <div className="text-center p-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p>Loading property data...</p>
            </div>
          ) : (
            /* Main Content - Shows when not loading OR when we have data (even if loading more) */
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStartDate(prev => moment(prev).subtract(7, 'days'));
                      loadData();
                    }}
                    className="p-2 border rounded hover:bg-gray-100"
                    disabled={loading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStartDate(moment().subtract(1, 'day'));
                      loadData();
                    }}
                    className="p-2 border rounded hover:bg-gray-100"
                    disabled={loading}
                  >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"  
                    onClick={() => {
                      setCurrentStartDate(prev => moment(prev).add(7, 'days'));
                      loadData();
                    }}
                    className="p-2 border rounded hover:bg-gray-100"
                    disabled={loading}
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
                  disabled={loading}
                />
              </div>

              {/* Data Table - Shows even during loading if we have some data */}
              <div className="overflow-x-auto relative">
                {loading && properties.length > 0 && (
                  <div className="absolute inset-0 bg-white bg-opacity-50 z-10 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                )}
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
                              isToday ? 'bg-green-300 font-bold' : idx % 2 === 0 ? 'bg-yellow-50' : 'bg-white'
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedProperty(prop)}
                                className="text-gray-500 hover:text-blue-600"
                                title="View details"
                              >
                                <Info className="w-4 h-4" />
                              </button>

                              <a
                                href={`http://192.168.1.105:3000/properties/${prop.id}/calendar`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={
                                  (prop.property_icals?.length > 0 && prop.property_icals[0]?.url
                                    ? 'text-blue-600 hover:underline'
                                    : 'bg-red-100 text-gray-800 p-1 rounded') +
                                  ' block'
                                }
                              >
                                {[prop.clients?.display_name, prop.short_address, prop.client_property_nickname]
                                  .filter(Boolean)
                                  .join(' – ') || 'Unnamed'}
                              </a>
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
            </>
          )}
        </div>
    </DashboardLayout>
  );
}
