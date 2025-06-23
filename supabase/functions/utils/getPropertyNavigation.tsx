// src/utils/getPropertyNavigation.ts

export function getPropertyNavigationItems(propertyId: number, currentPage: string) {
  return [
    {
      name: 'Activity',
      href: `/properties/${propertyId}/activity`,
      icon: <span className="text-sm font-medium">Activity</span>,
      current: currentPage === 'activity',
    },
    {
      name: 'Calendar',
      href: `/properties/${propertyId}/calendar`,
      icon: <span className="text-sm font-medium">Calendar</span>,
      current: currentPage === 'calendar',
    },
    {
      name: 'Tasks',
      href: `/properties/${propertyId}/tasks`,
      icon: <span className="text-sm font-medium">Tasks</span>,
      current: currentPage === 'tasks',
    },
    {
      name: 'Documents',
      href: `/properties/${propertyId}/documents`,
      icon: <span className="text-sm font-medium">Documents</span>,
      current: currentPage === 'documents',
    },
  ];
}