// src/app/properties/[propertyId]/tasks/create/page.tsx

'use client';

import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '../../../../../components/DashboardLayout.tsx';
import PropertyDetailPageLayout from '../../../../../components/PropertyDetailPageLayout.tsx';
import { getPropertyNavigationItems } from '../../../../../../supabase/functions/utils/getPropertyNavigation.tsx';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '../../../../../types/supabase.ts';
import type { PropertyWithClient } from '../../../../../types/supabase.ts';
import type { User } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient<Database>();

export default function CreateTaskPage() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [property, setProperty] = useState<PropertyWithClient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return router.push('/');
      setUser(userData.user);

      const { data: propertyData } = await supabase
        .from('properties')
        .select('*, clients(display_name)')
        .eq('id', Number(propertyId))
        .eq('platform_user_id', userData.user.id)
        .single();

      if (!propertyData) return router.push('/404');
      setProperty(propertyData as PropertyWithClient);
      setLoading(false);
    }

    fetchData();
  }, [propertyId, router]);

  if (loading || !property) return <p className="p-8">Loading...</p>;

  return (
    <DashboardLayout>
      <PropertyDetailPageLayout
        property={property}
        propertyId={property.id}
        navigationItems={getPropertyNavigationItems(property.id, 'tasks')}
      >
        <div className="max-w-xl space-y-4">
          <h1 className="text-2xl font-bold">Create New Task</h1>
          <p className="text-gray-600">
            This is where you will create a new cleaning task for{' '}
            <strong>{property.client_property_nickname || property.short_address}</strong>.
          </p>

          {/* Here we’ll later insert the actual form */}
          <div className="border border-gray-200 p-4 rounded bg-gray-50">
            <p className="text-sm text-gray-500">Task form coming soon...</p>
          </div>

          <button
            onClick={() => router.push(`/properties/${propertyId}/tasks`)}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to tasks
          </button>
        </div>
      </PropertyDetailPageLayout>
    </DashboardLayout>
  );
}
