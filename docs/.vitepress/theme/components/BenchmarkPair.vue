<script setup lang="ts">
import { withBase } from 'vitepress';
import { data } from '../../data/benchmark.data';
import { formatOps, formatRatio } from '../format';

// Both SVG charts of validators-benchmarks side by side: rules fixed in code and rules built at runtime
const charts = [
  {
    mode: 'static' as const,
    title: 'Rules fixed in code',
    subtitle: 'The validator is created once and reused',
  },
  {
    mode: 'dynamic' as const,
    title: 'Rules built at runtime',
    subtitle: 'From a database, per tenant, from a form builder: a new validator for every call',
  },
];

function alt(mode: 'static' | 'dynamic') {
  const rivals = data[mode]
    .map(rival => `${rival.name} ${formatRatio(rival.simple)} slower`)
    .join(', ');
  return `LIVR ${formatOps(data.livr[mode].simple)} operations per second on the simple form. ${rivals}.`;
}
</script>

<template>
  <div class="benchmark-pair">
    <figure v-for="chart in charts" :key="chart.mode" class="benchmark-pair__item">
      <figcaption>
        <strong>{{ chart.title }}</strong>
        <span>{{ chart.subtitle }}</span>
      </figcaption>
      <a :href="withBase(`/benchmark/latest-${chart.mode}.svg`)" target="_blank" rel="noopener">
        <img
          :src="withBase(`/benchmark/latest-${chart.mode}.svg`)"
          :alt="alt(chart.mode)"
          width="780"
          height="440"
          loading="lazy"
        />
      </a>
    </figure>
  </div>
  <p class="benchmark-pair__note">
    Node.js {{ data.node.replace(/^v/, '') }}, {{ data.cpu.replace(/ \d+-Core Processor$/, '') }},
    {{ data.date }}. Absolute numbers depend on the hardware, compare the ratios.
  </p>
</template>
