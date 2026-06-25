import { createHash } from 'crypto';
import { APARTMENT_LISTINGS } from '../lib/listings';
import { MOCK_LANDLORD_PROFILES } from '../lib/mock-landlord-profiles';
import { hashPassword } from '../lib/auth';
import {
  APARTMENT_CATALOG_DOCUMENT_ID,
  writeApartmentListingsToCouchbase,
} from '../lib/db/apartment-listings';
import {
  closeCouchbase,
  getCouchbaseCluster,
  getCouchbaseCollection,
  getCouchbaseKeyspace,
  isCouchbaseEnabled,
} from '../lib/db/couchbase';

type DemoAuthUser = {
  email: string;
  name: string;
  role: 'tenant' | 'landlord' | 'moderator';
  password: string;
};

type DemoEscrowUser = {
  wallet: string;
  displayName: string;
  role: 'landlord' | 'moderator';
};

type DemoAuthUserDocument = {
  type: 'demoAuthUser';
  id: string;
  email: string;
  name: string;
  role: 'tenant' | 'landlord' | 'moderator';
  passwordHash: string;
  createdAt: string;
};

type DemoLandlordProfileDocument = {
  type: 'demoLandlordProfile';
  wallet: string;
  name: string;
  email: string;
  landlord: string;
  totalStakedLamports: number;
  activeStakeLamports: number;
  completedRentals: number;
  disputesLost: number;
  exists: boolean;
  listingCount: number;
  reputationScore: number;
  createdAt: string;
};

const MODERATOR_WALLET = '34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e';

const DEMO_AUTH_USERS: DemoAuthUser[] = [
  { email: 'tenant@demo.com', name: 'Demo Tenant', role: 'tenant', password: 'password123' },
  { email: 'alice@demo.com', name: 'Alice (Landlord)', role: 'landlord', password: 'password123' },
  { email: 'bob@demo.com', name: 'Bob (Landlord)', role: 'landlord', password: 'password123' },
  { email: 'carol@demo.com', name: 'Carol (Landlord)', role: 'landlord', password: 'password123' },
  { email: 'dave@demo.com', name: 'Dave (Landlord)', role: 'landlord', password: 'password123' },
  { email: 'eve@demo.com', name: 'Eve (Landlord)', role: 'landlord', password: 'password123' },
  { email: 'frank@demo.com', name: 'Frank (Landlord)', role: 'landlord', password: 'password123' },
  { email: 'grace@demo.com', name: 'Grace (Landlord)', role: 'landlord', password: 'password123' },
  { email: 'henry@demo.com', name: 'Henry (Landlord)', role: 'landlord', password: 'password123' },
  { email: 'irene@demo.com', name: 'Irene (Landlord)', role: 'landlord', password: 'password123' },
  { email: 'jack@demo.com', name: 'Jack (Landlord)', role: 'landlord', password: 'password123' },
  { email: 'moderator@demo.com', name: 'Demo Moderator', role: 'moderator', password: 'password123' },
];

const DEMO_ESCROW_USERS: DemoEscrowUser[] = [
  { wallet: '34G8SyYe3N9JnDe9zMTheZbfbJCrHtwB6MAjfmy9h68e', displayName: 'Alice', role: 'landlord' },
  { wallet: '7oYg85FpwboPrwDUMABYMjtAk9mQYqFck9TzM8ZNQLYq', displayName: 'Bob', role: 'landlord' },
  { wallet: '9nWcd1EWhogJsBtk1Q43GP9eVvn6K9TgaSG5JyhnTp6X', displayName: 'Carol', role: 'landlord' },
  { wallet: 'DtHv4Tywz2VzFxCY8MpHf7VnCqXjM3K2vN5pR9uS4wX7', displayName: 'Dave', role: 'landlord' },
  { wallet: 'F8kM3b2nP5xLr7KdQeV4gY1hT6wJm9CaB3nR5sE2fU8', displayName: 'Eve', role: 'landlord' },
  { wallet: 'G9nL4c3qR6yMs8KeFfW5hZ2iU7xKn0DbC4oT6tF3gV9', displayName: 'Frank', role: 'landlord' },
  { wallet: 'H0m5d4rS7zNt9LgGgY7jB4kW9zMp2FdE6qV9wI6jY2', displayName: 'Grace', role: 'landlord' },
  { wallet: 'I1n6e5tT8aOu0MhHhZ8kC5lX0aAq3GeF7rW0xJ7kZ3', displayName: 'Henry', role: 'landlord' },
  { wallet: 'J2o7f6uU9bPv1NiIiA9lD6mY1bBr4HfG8sX1yK8lA4', displayName: 'Irene', role: 'landlord' },
  { wallet: 'K3p8g7vV0cQw2OjJjB0mE7nZ2cCs5IgH9tY2zL9mB5', displayName: 'Jack', role: 'landlord' },
  { wallet: MODERATOR_WALLET, displayName: 'Moderator', role: 'moderator' },
];

function authUserId(email: string): string {
  return createHash('sha256').update(email).digest('hex').slice(0, 32);
}

function authUserDocId(email: string): string {
  return `demo::auth-user::${email}`;
}

function escrowUserDocId(wallet: string): string {
  return `escrow::user::${wallet}`;
}

function landlordProfileDocId(wallet: string): string {
  return `demo::landlord-profile::${wallet}`;
}

function manifestDocId(): string {
  return 'demo::dataset-manifest';
}

function quoteIdentifier(identifier: string): string {
  return `\`${identifier.replace(/`/g, '``')}\``;
}

async function ensurePrimaryIndex(
  bucket: string,
  scope: string,
  collection: string,
): Promise<void> {
  const cluster = await getCouchbaseCluster();
  const target = `${quoteIdentifier(bucket)}.${quoteIdentifier(scope)}.${quoteIdentifier(collection)}`;
  await cluster.query(`CREATE PRIMARY INDEX IF NOT EXISTS ON ${target}`);
}

async function deleteAllDocuments(
  bucket: string,
  scope: string,
  collection: string,
): Promise<void> {
  const cluster = await getCouchbaseCluster();
  const target = `${quoteIdentifier(bucket)}.${quoteIdentifier(scope)}.${quoteIdentifier(collection)}`;
  await ensurePrimaryIndex(bucket, scope, collection);
  await cluster.query(`DELETE FROM ${target}`);
}

async function seedListings(): Promise<void> {
  await writeApartmentListingsToCouchbase(APARTMENT_LISTINGS);
}

async function seedEscrowUsers(collectionName: string): Promise<void> {
  const scope = process.env.COUCHBASE_SCOPE || '_default';
  const collection = await getCouchbaseCollection(scope, collectionName);
  const createdAt = new Date().toISOString();

  for (const user of DEMO_ESCROW_USERS) {
    await collection.upsert(escrowUserDocId(user.wallet), {
      type: 'escrowUser',
      wallet: user.wallet,
      displayName: user.displayName,
      role: user.role,
      createdAt,
    });
  }
}

async function seedAuthUsers(collectionName: string): Promise<void> {
  const scope = process.env.COUCHBASE_SCOPE || '_default';
  const collection = await getCouchbaseCollection(scope, collectionName);
  const createdAt = new Date().toISOString();

  for (const user of DEMO_AUTH_USERS) {
    const doc: DemoAuthUserDocument = {
      type: 'demoAuthUser',
      id: authUserId(user.email),
      email: user.email,
      name: user.name,
      role: user.role,
      passwordHash: hashPassword(user.password),
      createdAt,
    };
    await collection.upsert(authUserDocId(user.email), doc);
  }
}

async function seedLandlordProfiles(collectionName: string): Promise<void> {
  const scope = process.env.COUCHBASE_SCOPE || '_default';
  const collection = await getCouchbaseCollection(scope, collectionName);
  const createdAt = new Date().toISOString();

  for (const [wallet, profile] of Object.entries(MOCK_LANDLORD_PROFILES)) {
    const doc: DemoLandlordProfileDocument = {
      type: 'demoLandlordProfile',
      wallet,
      name: profile.name,
      email: profile.email,
      landlord: profile.landlord,
      totalStakedLamports: profile.totalStakedLamports,
      activeStakeLamports: profile.activeStakeLamports,
      completedRentals: profile.completedRentals,
      disputesLost: profile.disputesLost,
      exists: profile.exists,
      listingCount: profile.listingCount,
      reputationScore: profile.reputationScore,
      createdAt,
    };
    await collection.upsert(landlordProfileDocId(wallet), doc);
  }
}

async function seedManifest(collectionName: string): Promise<void> {
  const scope = process.env.COUCHBASE_SCOPE || '_default';
  const collection = await getCouchbaseCollection(scope, collectionName);
  await collection.upsert(manifestDocId(), {
    type: 'demoDatasetManifest',
    updatedAt: new Date().toISOString(),
    listingsDocumentId: APARTMENT_CATALOG_DOCUMENT_ID,
    listingCount: APARTMENT_LISTINGS.length,
    escrowUserCount: DEMO_ESCROW_USERS.length,
    authUserCount: DEMO_AUTH_USERS.length,
    landlordProfileCount: Object.keys(MOCK_LANDLORD_PROFILES).length,
  });
}

async function main() {
  if (!isCouchbaseEnabled()) {
    throw new Error('Set USE_COUCHBASE=true and Couchbase variables in .env before migrating demo data');
  }

  const keyspace = getCouchbaseKeyspace();
  const escrowCollectionName = process.env.COUCHBASE_ESCROW_COLLECTION || keyspace.collection;
  const uniqueCollections = Array.from(new Set([keyspace.collection, escrowCollectionName]));

  console.log(
    `Resetting Couchbase demo data in ${keyspace.bucket}.${keyspace.scope} across collections: ${uniqueCollections.join(', ')}`,
  );

  for (const collectionName of uniqueCollections) {
    await deleteAllDocuments(keyspace.bucket, keyspace.scope, collectionName);
    console.log(`Deleted all documents from ${keyspace.bucket}.${keyspace.scope}.${collectionName}`);
  }

  await seedListings();
  await seedEscrowUsers(escrowCollectionName);
  await seedAuthUsers(escrowCollectionName);
  await seedLandlordProfiles(escrowCollectionName);
  await seedManifest(escrowCollectionName);

  console.log(
    [
      `Seeded listings document: ${APARTMENT_CATALOG_DOCUMENT_ID}`,
      `Seeded escrow users: ${DEMO_ESCROW_USERS.length}`,
      `Seeded auth users: ${DEMO_AUTH_USERS.length}`,
      `Seeded landlord profiles: ${Object.keys(MOCK_LANDLORD_PROFILES).length}`,
    ].join('\n'),
  );
}

main()
  .catch((error) => {
    console.error(
      'Could not migrate demo data to Couchbase:',
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  })
  .finally(closeCouchbase);
