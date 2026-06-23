import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'source-index.json');

const ignoredDirectories = new Set([
  '.agora',
  '.git',
  '.next',
  '.pnpm-store',
  '.vercel',
  'coverage',
  'node_modules',
]);

const ignoredFiles = new Set([
  '.DS_Store',
  '.env.local',
  'next-env.d.ts',
  'pnpm-lock.yaml',
  'source-index.json',
  'tsconfig.tsbuildinfo',
]);

const textExtensions = new Set([
  '.css',
  '.d.ts',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.svg',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);

const extensionlessTextFiles = new Set([
  '.dockerignore',
  '.gitattributes',
  '.gitignore',
  '.npmrc',
  '.nvmrc',
  'Dockerfile',
  'LICENSE',
]);

function isIndexable(relativePath) {
  const base = path.basename(relativePath);
  if (ignoredFiles.has(base)) return false;
  if (base.startsWith('.env') && base !== 'env.local.example') return false;
  if (extensionlessTextFiles.has(base)) return true;
  if (base === 'env.local.example') return true;
  if (base.endsWith('.d.ts')) return true;
  return textExtensions.has(path.extname(base));
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    const relativePath = path.relative(root, absolutePath).split(path.sep).join('/');
    if (entry.isDirectory()) paths.push(...(await walk(absolutePath)));
    else if (entry.isFile() && isIndexable(relativePath)) paths.push(relativePath);
  }

  return paths;
}

function collectExports(source) {
  const exports = new Set();
  const declarationPattern =
    /export\s+(?:default\s+)?(?:declare\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g;
  const listPattern = /export\s*{([^}]+)}/g;

  for (const match of source.matchAll(declarationPattern)) exports.add(match[1]);
  for (const match of source.matchAll(listPattern)) {
    for (const item of match[1].split(',')) {
      const name = item.trim().split(/\s+as\s+/).pop();
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) exports.add(name);
    }
  }

  return [...exports].sort();
}

const paths = (await walk(root)).sort();
const files = [];

for (const relativePath of paths) {
  const absolutePath = path.join(root, relativePath);
  const [contents, metadata] = await Promise.all([
    readFile(absolutePath, 'utf8'),
    stat(absolutePath),
  ]);
  const isCode = /\.(?:[cm]?[jt]sx?|d\.ts)$/.test(relativePath);
  files.push({
    path: relativePath,
    size: metadata.size,
    mtime: metadata.mtimeMs,
    sha256: createHash('sha256').update(contents).digest('hex'),
    exports: isCode ? collectExports(contents) : [],
  });
}

const index = {
  generated: Date.now(),
  fileCount: files.length,
  files,
};

await writeFile(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
console.log(`Indexed ${files.length} files into source-index.json.`);
