// src/app/properties/[propertyId]/calendar/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database, Tables } from 'types/supabase';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import type { User } from '@supabase/supabase-js';
import type { View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import DashboardLayout from '../../../../components/DashboardLayout';
import PropertyDetailPageLayout from '../../../../components/PropertyDetailPageLayout';
import type { PropertyWithClient } from 'src/generated-types/customTypes';
import { getPropertyNavigationItems } from '../../../../../supabase/functions/utils/getPropertyNavigation';
import CreateTaskDrawer from '../../../../components/CreateTaskDrawer';

type Reservation  = Tables<'reservations'>;
type CleaningTask = Tables<'cleaning_tasks'>;
type TaskType = Tables<'task_types'>;

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  isLastDay: boolean;
  isFirstDay: boolean;
  resource: {
    type: 'reservation' | 'task';
    data: Reservation | CleaningTask;
  };
  style?: React.CSSProperties;
  sortKey?: string;
  priority: number; // lower means higher visual priority
};

const localizer = momentLocalizer(moment);
const supabase  = createClientComponentClient<Database>();

function CustomEvent({ event }: { event: CalendarEvent }) {
  const isLastDay = event.isLastDay;

  return (
    <div
      style={{
        height: '100%',
        width: isLastDay ? '100%' : '100%',
        backgroundColor: event.style?.backgroundColor || '#ccc',
        border: `1px solid ${event.style?.borderColor || '#999'}`,
        borderRadius: '4px',
        padding: '2px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <span style={{ fontSize: '0.8rem' }}>{event.title}</span>
    </div>
  );
}

export default function PropertyCalendarPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [property, setProperty] = useState<PropertyWithClient | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [cleaningTasks, setCleaningTasks] = useState<CleaningTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showDrawer, setShowDrawer] = useState(false);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);

  useEffect(() => {
    async function loadCalendarData() {
      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/');
        return;
      }
      setUser(userData.user);

      if (!propertyId) {
        setError('Property ID is missing from URL.');
        setLoading(false);
        return;
      }

      const propertyIdNum = Number(propertyId);

      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*, clients(display_name)')
        .eq('id', propertyIdNum)
        .eq('platform_user_id', userData.user.id)
        .single();

      if (propertyError) {
        console.error('Error fetching property details:', propertyError);
        setError('Failed to load property: ' + propertyError.message);
        setLoading(false);
        return;
      }
      setProperty(propertyData as PropertyWithClient);

      const { data: resData, error: resError } = await supabase
        .from('reservations')
        .select('*')
        .eq('property_id', propertyIdNum)
        .eq('platform_user_id', userData.user.id);

      if (resError) {
        console.error('Error fetching reservations:', resError);
        setError('Failed to load reservations: ' + resError.message);
        setLoading(false);
        return;
      }
      setReservations(resData || []);

      const { data: tasksData, error: tasksError } = await supabase
        .from('cleaning_tasks')
        .select('*, task_types(name)')
        .eq('property_id', propertyIdNum)
        .eq('platform_user_id', userData.user.id);

      if (tasksError) {
        console.error('Error fetching cleaning tasks:', tasksError);
        setError('Failed to load cleaning tasks: ' + tasksError.message);
        setLoading(false);
        return;
      }
      setCleaningTasks(tasksData || []);

      setLoading(false);
    }

    loadCalendarData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/');
      }
    });
    return () => { subscription?.unsubscribe(); };
  }, [propertyId, router]);

  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

reservations.forEach(res => {
  const startDate = new Date(res.start_date);
  const endDate = new Date(res.end_date);

  // 1. Check-in slice (first day)
  calendarEvents.push({
    id: `res-${res.id}-checkin`,
    title: res.guest_name || 'Reservation',
    start: startDate,
    end: moment(startDate).endOf('day').toDate(),
    allDay: true,
    isLastDay: false,
    isFirstDay: true, // NEW
    sortKey: `1-${res.id}-checkin`,
    priority: 1,
    resource: { type: 'reservation', data: res },
    style: {
      backgroundColor: res.status === 'cancelled'
        ? '#ffcccc'
        : res.source === 'Airbnb'
          ? '#ffadad'
          : '#b3e0ff',
      borderColor: res.status === 'cancelled' ? '#cc0000' : '#007bff'
    }
  });

  // 2. Middle span (if multi-day)
  const middleStart = moment(startDate).add(1, 'days');
  const middleEnd = moment(endDate).subtract(1, 'days');
  if (middleEnd.isSameOrAfter(middleStart, 'day')) {
    calendarEvents.push({
      id: `res-${res.id}-mid`,
      title: res.guest_name || 'Reservation',
      start: middleStart.toDate(),
      end: middleEnd.toDate(),
      allDay: true,
      isLastDay: false,
      isFirstDay: false,
      sortKey: `2-${res.id}-mid`,
      priority: 2,
      resource: { type: 'reservation', data: res },
      style: {
        backgroundColor: res.status === 'cancelled'
          ? '#ffcccc'
          : res.source === 'Airbnb'
            ? '#ffadad'
            : '#b3e0ff',
        borderColor: res.status === 'cancelled' ? '#cc0000' : '#007bff'
      }
    });
  }

  // 3. Check-out slice
  calendarEvents.push({
    id: `res-${res.id}-checkout`,
    title: '✓ ' + (res.guest_name || 'Checkout'),
    start: moment(endDate).startOf('day').toDate(),
    end: moment(endDate).hour(10).toDate(),
    allDay: true,
    isLastDay: true,
    isFirstDay: false,
    sortKey: `3-${res.id}-checkout`,
    priority: 3,
    resource: { type: 'reservation', data: res },
    style: {
      backgroundColor: res.status === 'cancelled' ? '#ffeeee' : '#b3e0ff',
      borderColor: res.status === 'cancelled' ? '#cc0000' : '#007bff'
    }
  });
});

    cleaningTasks.forEach(task => {
      const taskTypeName = (task as any).task_types?.name ?? 'Other';

      calendarEvents.push({
        id: `task-${task.id}`,
        title: taskTypeName === 'Clean'
          ? `Clean – ${task.priority_tag || 'N/A'}`
          : taskTypeName,
        start: new Date(task.scheduled_date),
        end: new Date(task.scheduled_date),
        allDay: true,
        isLastDay: false,
        isFirstDay: false,
        sortKey: `4-${task.id}`,
        priority: 4,
        resource: { type: 'task', data: task },
        style: {
          backgroundColor:
            task.status === 'Completed'
              ? '#d4edda'
              : task.task_category === 'Issue'
                ? '#f8d7da'
                : '#fff3cd',
          borderColor:
            task.status === 'Completed'
              ? '#28a745'
              : task.task_category === 'Issue'
                ? '#dc3545'
                : '#ffc107',
          color: 'black'
        }
      });
    });

    calendarEvents.sort((a, b) => {
      if (a.start < b.start) return -1;
      if (a.start > b.start) return 1;
      return (
        (a.sortKey ?? '').localeCompare(b.sortKey ?? '')
      );
    });

    return calendarEvents;
  }, [reservations, cleaningTasks]);

  if (loading) return <p className="p-8">Loading calendar data...</p>;
  if (error)   return <p className="p-8 text-red-600">Error: {error}</p>;
  if (!user)   return <p className="p-8">Redirecting to login...</p>;
  if (!property) {
    return <p className="p-8 text-gray-600">Property not found.</p>;
  }

  return (
    <DashboardLayout>
      <PropertyDetailPageLayout
        property={property}
        propertyId={property.id}
        navigationItems={getPropertyNavigationItems(property.id, 'calendar')}
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h1 className="text-3xl font-bold">
              {property
                ? `Calendar - ${property.client_property_nickname ? `${property.client_property_nickname} - ` : ''}${property.short_address}`
                : `Calendar for Property ${propertyId}`}
            </h1>
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
              Create New Task
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md" style={{ height: '800px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              step={60}
              timeslots={1}
              min={moment().startOf('day').toDate()}
              max={moment().endOf('day').toDate()}
              style={{ height: '100%' }}
              views={['month', 'week', 'day']}
              view={currentView}
              date={currentDate}
              onView={setCurrentView}
              onNavigate={setCurrentDate}
              eventPropGetter={(event: CalendarEvent) => ({
                style: {
                  ...event.style,
                  ...(currentView === 'month' && event.isLastDay && { width: '33%', float: 'left' }),
                  ...(currentView === 'week' && event.isLastDay && { width: '33%' }),
                  ...(currentView === 'month' && event.isFirstDay && { width: '33%', float: 'right' }),
                  ...(currentView === 'week' && event.isFirstDay && { width: '33%' }),
                },
              })}
              components={{ event: CustomEvent }}
              dayLayoutAlgorithm="no-overlap"
            />
          </div>
        </div>
        {showDrawer && property && (
          <CreateTaskDrawer
            defaultProperty={property} // 👈 prefilled and locked
            onClose={() => setShowDrawer(false)}
            onCreated={async () => {
              setShowDrawer(false);
                const { data } = await supabase
                  .from('cleaning_tasks')
                  .select('*, properties(short_address, client_property_nickname), task_types(name)')
                  .eq('property_id', property.id)
                  .order('scheduled_date', { ascending: false });
              if (data) setCleaningTasks(data);
            }}
          />
        )}
      </PropertyDetailPageLayout>
    </DashboardLayout>
  );

}
