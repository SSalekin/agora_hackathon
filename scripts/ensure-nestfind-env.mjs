import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const rootEnvPath = path.join(repoRoot, '.env');
const appDir = path.join(repoRoot, 'apps', 'nestfind');
const appEnvPath = path.join(appDir, '.env.local');
const appEnvExamplePath = path.join(appDir, 'env.local.example');

if (!fs.existsSync(appDir)) {
  console.error('apps/nestfind is missing');
  process.exit(1);
}

if (fs.existsSync(appEnvPath)) {
  process.exit(0);
}

if (fs.existsSync(rootEnvPath)) {
  fs.copyFileSync(rootEnvPath, appEnvPath);
  console.log('Created apps/nestfind/.env.local from root .env');
  process.exit(0);
}

if (fs.existsSync(appEnvExamplePath)) {
  fs.copyFileSync(appEnvExamplePath, appEnvPath);
  console.log('Created apps/nestfind/.env.local from env.local.example');
  process.exit(0);
}

console.error('Missing both root .env and apps/nestfind/env.local.example');
process.exit(1);
