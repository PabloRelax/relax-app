// src/generated-types/customTypes.ts

import type { Tables } from 'types/supabase';

export type PropertyWithClient = Tables<'properties'> & {
  clients: Pick<Tables<'clients'>, 'display_name'> | null;
  property_icals: Pick<Tables<'property_icals'>, 'url'>[];
  property_service_types: Pick<Tables<'property_service_types'>, 'name'> | null;
  cities: { name: string } | null;
  suburbs: { name: string } | null;
};
