'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function TenantDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tenant Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.name}. Find your perfect apartment.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="surface-panel rounded-xl p-6">
          <h2 className="font-semibold text-lg text-foreground mb-2">Search Apartments</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Browse available apartments in Da Nang with voice-powered search.
          </p>
          <Link href="/" className="text-primary hover:underline text-sm font-medium">
            Start searching &rarr;
          </Link>
        </div>

        <div className="surface-panel rounded-xl p-6">
          <h2 className="font-semibold text-lg text-foreground mb-2">My Agreements</h2>
          <p className="text-sm text-muted-foreground">
            View and manage your escrow agreements with landlords.
          </p>
          <p className="text-xs text-muted-foreground mt-4">No agreements yet</p>
        </div>

        <div className="surface-panel rounded-xl p-6">
          <h2 className="font-semibold text-lg text-foreground mb-2">Saved Listings</h2>
          <p className="text-sm text-muted-foreground">
            Access your saved apartment listings and favorites.
          </p>
          <p className="text-xs text-muted-foreground mt-4">No saved listings</p>
        </div>
      </div>
    </div>
  );
}
