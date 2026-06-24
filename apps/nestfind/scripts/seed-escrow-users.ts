import { upsertEscrowUser } from '../lib/db/escrow-users';
import { closeCouchbase, isCouchbaseEnabled } from '../lib/db/couchbase';

const MODERATOR_WALLET = '34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e';

const SEED_USERS = [
  { wallet: '34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e', displayName: 'Alice', role: 'landlord' as const },
  { wallet: '7oYg85FpwboPrwDUMABYMjtAk9mQYqFck9TzM8ZNQLYq', displayName: 'Bob', role: 'landlord' as const },
  { wallet: '9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X', displayName: 'Carol', role: 'landlord' as const },
  { wallet: 'DtHv4Tywz2VzFxCY8MpHf7VnCqXjM3K2vN5pR9uS4wX7', displayName: 'Dave', role: 'landlord' as const },
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
