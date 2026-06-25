'use client';

import { APARTMENT_LISTINGS } from '@/lib/listings';
import { ModeratorDashboard as ModeratorWorkspace } from '@/components/apartment/ModeratorDashboard';

export default function ModeratorDashboardPage() {
  return <ModeratorWorkspace listings={APARTMENT_LISTINGS} />;
}
