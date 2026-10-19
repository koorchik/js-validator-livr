import fs from 'node:fs';
import { defineLoader } from 'vitepress';

// public/benchmark/latest.json is downloaded by scripts/fetch-benchmark.mjs from validators-benchmarks

type Scores = Record<string, { simple: number; nested: number }>;

interface Measurement {
  date: string;
  node: string;
  cpu: string;
  runs: number;
  versions: Record<string, string>;
  results: { static: Scores; dynamic: Scores };
}

export interface Rival {
  name: string;
  version: string;
  // How many times LIVR is faster, for the simple and the nested scenario
  simple: number;
  nested: number;
}

export interface BenchmarkData {
  date: string;
  node: string;
  cpu: string;
  runs: number;
  livrVersion: string;
  // Operations per second of LIVR
  livr: { static: { simple: number; nested: number }; dynamic: { simple: number; nested: number } };
  static: Rival[];
  dynamic: Rival[];
}

declare const data: BenchmarkData;
export { data };

function rivals(measurement: Measurement, mode: 'static' | 'dynamic'): Rival[] {
  const scores = measurement.results[mode];
  const livr = scores.LIVR;

  return Object.keys(scores)
    .filter(name => name !== 'LIVR')
    .map(name => ({
      name,
      version: measurement.versions[name],
      simple: livr.simple / scores[name].simple,
      nested: livr.nested / scores[name].nested,
    }))
    .sort((a, b) => a.simple - b.simple);
}

export default defineLoader({
  watch: ['../../public/benchmark/latest.json'],
  load([file]: string[]): BenchmarkData {
    if (!file) throw new Error('public/benchmark/latest.json is missing, run npm run benchmark');
    const measurement: Measurement = JSON.parse(fs.readFileSync(file, 'utf8'));

    return {
      date: measurement.date,
      node: measurement.node,
      cpu: measurement.cpu,
      runs: measurement.runs,
      livrVersion: measurement.versions.LIVR,
      livr: { static: measurement.results.static.LIVR, dynamic: measurement.results.dynamic.LIVR },
      static: rivals(measurement, 'static'),
      dynamic: rivals(measurement, 'dynamic'),
    };
  },
});
