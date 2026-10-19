// Downloads the newest benchmark results and charts of validators-benchmarks into public/benchmark.
// The benchmark code lives in its own repository; this site only shows the published results.
// BENCHMARK_RESULTS=../../livr-benchmark/results copies them from a local checkout instead.
import fs from 'node:fs/promises';
import path from 'node:path';

const FILES = ['latest.json', 'latest-static.svg', 'latest-dynamic.svg'];
const REMOTE = 'https://raw.githubusercontent.com/koorchik/validators-benchmarks/master/results';

const outDir = path.join(import.meta.dirname, '..', 'public', 'benchmark');
const localDir = process.env.BENCHMARK_RESULTS;

async function read(file) {
  if (localDir) return fs.readFile(path.resolve(localDir, file));

  const response = await fetch(`${REMOTE}/${file}`);
  if (!response.ok) throw new Error(`${REMOTE}/${file}: ${response.status} ${response.statusText}`);
  return Buffer.from(await response.arrayBuffer());
}

await fs.mkdir(outDir, { recursive: true });

for (const file of FILES) {
  await fs.writeFile(path.join(outDir, file), await read(file));
}

console.log(`Benchmark results from ${localDir || REMOTE} saved to public/benchmark`);
