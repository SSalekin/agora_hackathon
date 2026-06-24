'use client';

import { useAuth } from '@/lib/auth-context';

export default function ModeratorDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Moderator Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.name}. Oversee platform activity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="surface-panel rounded-xl p-6">
          <h2 className="font-semibold text-lg text-foreground mb-2">Disputes</h2>
          <p className="text-sm text-muted-foreground">
            Review and resolve tenant-landlord disputes.
          </p>
          <p className="text-xs text-muted-foreground mt-4">No active disputes</p>
        </div>

        <div className="surface-panel rounded-xl p-6">
          <h2 className="font-semibold text-lg text-foreground mb-2">Active Agreements</h2>
          <p className="text-sm text-muted-foreground">
            Monitor all active escrow agreements on the platform.
          </p>
          <p className="text-xs text-muted-foreground mt-4">No active agreements</p>
        </div>

        <div className="surface-panel rounded-xl p-6">
          <h2 className="font-semibold text-lg text-foreground mb-2">Platform Activity</h2>
          <p className="text-sm text-muted-foreground">
            View recent registrations and platform activity.
          </p>
          <p className="text-xs text-muted-foreground mt-4">No recent activity</p>
        </div>
      </div>
    </div>
  );
}
