import type { LandlordProfileData } from '@/hooks/use-landlord-profile';

export type MockLandlordProfile = LandlordProfileData & {
  name: string;
  email: string;
  listingCount: number;
  reputationScore: number;
};

const LAMPORTS_PER_SOL = 1_000_000_000;

function solToLamports(sol: number): number {
  return Math.round(sol * LAMPORTS_PER_SOL);
}

export const MOCK_LANDLORD_PROFILES: Record<string, MockLandlordProfile> = {
  '34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e': {
    name: 'Alice',
    email: 'alice@demo.com',
    landlord: '34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e',
    totalStakedLamports: solToLamports(0.005),
    activeStakeLamports: solToLamports(0.004),
    completedRentals: 18,
    disputesLost: 1,
    exists: true,
    listingCount: 5,
    reputationScore: 4.8,
  },
  '7oYg85FpwboPrwDUMABYMjtAk9mQYqFck9TzM8ZNQLYq': {
    name: 'Bob',
    email: 'bob@demo.com',
    landlord: '7oYg85FpwboPrwDUMABYMjtAk9mQYqFck9TzM8ZNQLYq',
    totalStakedLamports: solToLamports(0.01),
    activeStakeLamports: solToLamports(0.008),
    completedRentals: 24,
    disputesLost: 0,
    exists: true,
    listingCount: 4,
    reputationScore: 5.0,
  },
  '9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X': {
    name: 'Carol',
    email: 'carol@demo.com',
    landlord: '9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X',
    totalStakedLamports: solToLamports(0.003),
    activeStakeLamports: solToLamports(0.002),
    completedRentals: 10,
    disputesLost: 2,
    exists: true,
    listingCount: 4,
    reputationScore: 4.2,
  },
  'DtHv4Tywz2VzFxCY8MpHf7VnCqXjM3K2vN5pR9uS4wX7': {
    name: 'Dave',
    email: 'dave@demo.com',
    landlord: 'DtHv4Tywz2VzFxCY8MpHf7VnCqXjM3K2vN5pR9uS4wX7',
    totalStakedLamports: solToLamports(0.002),
    activeStakeLamports: solToLamports(0.0015),
    completedRentals: 6,
    disputesLost: 0,
    exists: true,
    listingCount: 3,
    reputationScore: 4.9,
  },
  'F8kM3b2nP5xLr7KdQeV4gY1hT6wJm9CaB3nR5sE2fU8': {
    name: 'Eve',
    email: 'eve@demo.com',
    landlord: 'F8kM3b2nP5xLr7KdQeV4gY1hT6wJm9CaB3nR5sE2fU8',
    totalStakedLamports: solToLamports(0.02),
    activeStakeLamports: solToLamports(0.015),
    completedRentals: 32,
    disputesLost: 3,
    exists: true,
    listingCount: 3,
    reputationScore: 4.5,
  },
  'G9nL4c3qR6yMs8KeFfW5hZ2iU7xKn0DbC4oT6tF3gV9': {
    name: 'Frank',
    email: 'frank@demo.com',
    landlord: 'G9nL4c3qR6yMs8KeFfW5hZ2iU7xKn0DbC4oT6tF3gV9',
    totalStakedLamports: solToLamports(0.001),
    activeStakeLamports: solToLamports(0.0005),
    completedRentals: 3,
    disputesLost: 0,
    exists: true,
    listingCount: 3,
    reputationScore: 4.7,
  },
  'H0m5d4rS7zNt9LgGgY7jB4kW9zMp2FdE6qV9wI6jY2': {
    name: 'Grace',
    email: 'grace@demo.com',
    landlord: 'H0m5d4rS7zNt9LgGgY7jB4kW9zMp2FdE6qV9wI6jY2',
    totalStakedLamports: solToLamports(0.05),
    activeStakeLamports: solToLamports(0.04),
    completedRentals: 45,
    disputesLost: 5,
    exists: true,
    listingCount: 1,
    reputationScore: 4.3,
  },
  'I1n6e5tT8aOu0MhHhZ8kC5lX0aAq3GeF7rW0xJ7kZ3': {
    name: 'Henry',
    email: 'henry@demo.com',
    landlord: 'I1n6e5tT8aOu0MhHhZ8kC5lX0aAq3GeF7rW0xJ7kZ3',
    totalStakedLamports: solToLamports(0.0006),
    activeStakeLamports: solToLamports(0.0003),
    completedRentals: 2,
    disputesLost: 0,
    exists: true,
    listingCount: 1,
    reputationScore: 4.6,
  },
  'J2o7f6uU9bPv1NiIiA9lD6mY1bBr4HfG8sX1yK8lA4': {
    name: 'Irene',
    email: 'irene@demo.com',
    landlord: 'J2o7f6uU9bPv1NiIiA9lD6mY1bBr4HfG8sX1yK8lA4',
    totalStakedLamports: solToLamports(0.03),
    activeStakeLamports: solToLamports(0.025),
    completedRentals: 52,
    disputesLost: 2,
    exists: true,
    listingCount: 1,
    reputationScore: 4.9,
  },
  'K3p8g7vV0cQw2OjJjB0mE7nZ2cCs5IgH9tY2zL9mB5': {
    name: 'Jack',
    email: 'jack@demo.com',
    landlord: 'K3p8g7vV0cQw2OjJjB0mE7nZ2cCs5IgH9tY2zL9mB5',
    totalStakedLamports: solToLamports(0.0008),
    activeStakeLamports: solToLamports(0.0005),
    completedRentals: 4,
    disputesLost: 1,
    exists: true,
    listingCount: 1,
    reputationScore: 4.1,
  },
};

export function getMockLandlordProfile(wallet: string): MockLandlordProfile | undefined {
  return MOCK_LANDLORD_PROFILES[wallet];
}

export function getAllMockLandlordProfiles(): MockLandlordProfile[] {
  return Object.values(MOCK_LANDLORD_PROFILES);
}
