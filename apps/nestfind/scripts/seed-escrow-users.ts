import { upsertEscrowUser } from '../lib/db/escrow-users';
import { closeCouchbase, isCouchbaseEnabled } from '../lib/db/couchbase';

const MODERATOR_WALLET = '34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e';

const SEED_USERS = [
  { wallet: '34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e', displayName: 'Alice', role: 'landlord' as const },
  { wallet: '7oYg85FpwboPrwDUMABYMjtAk9mQYqFck9TzM8ZNQLYq', displayName: 'Bob', role: 'landlord' as const },
  { wallet: '9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X', displayName: 'Carol', role: 'landlord' as const },
  { wallet: 'DtHv4Tywz2VzFxCY8MpHf7VnCqXjM3K2vN5pR9uS4wX7', displayName: 'Dave', role: 'landlord' as const },
  { wallet: 'F8kM3b2nP5xLr7KdQeV4gY1hT6wJm9CaB3nR5sE2fU8', displayName: 'Eve', role: 'landlord' as const },
  { wallet: 'G9nL4c3qR6yMs8KeFfW5hZ2iU7xKn0DbC4oT6tF3gV9', displayName: 'Frank', role: 'landlord' as const },
  { wallet: 'H0m5d4rS7zNt9LgGgY7jB4kW9zMp2FdE6qV9wI6jY2', displayName: 'Grace', role: 'landlord' as const },
  { wallet: 'I1n6e5tT8aOu0MhHhZ8kC5lX0aAq3GeF7rW0xJ7kZ3', displayName: 'Henry', role: 'landlord' as const },
  { wallet: 'J2o7f6uU9bPv1NiIiA9lD6mY1bBr4HfG8sX1yK8lA4', displayName: 'Irene', role: 'landlord' as const },
  { wallet: 'K3p8g7vV0cQw2OjJjB0mE7nZ2cCs5IgH9tY2zL9mB5', displayName: 'Jack', role: 'landlord' as const },
  { wallet: MODERATOR_WALLET, displayName: 'Moderator', role: 'moderator' as const },
];

async function main() {
  if (!isCouchbaseEnabled()) {
    throw new Error('Set USE_COUCHBASE=true and Couchbase variables in .env before seeding escrow users');
  }

  for (const user of SEED_USERS) {
    await upsertEscrowUser(user.wallet, {
      displayName: user.displayName,
      role: user.role,
    });
    console.log(`Seeded user: ${user.displayName} (${user.role}) -> ${user.wallet}`);
  }

  console.log(`Seeded ${SEED_USERS.length} escrow users.`);
}

main()
  .catch((error) => {
    console.error('Could not seed escrow users:', error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(closeCouchbase);
