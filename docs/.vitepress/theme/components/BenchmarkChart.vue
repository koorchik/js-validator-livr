<script setup lang="ts">
import { computed } from 'vue';
import { withBase } from 'vitepress';
import { data } from '../../data/benchmark.data';
import { formatOps, formatRatio } from '../format';

// The SVG charts are drawn by validators-benchmarks and downloaded by scripts/fetch-benchmark.mjs
const props = defineProps<{ mode: 'static' | 'dynamic' }>();

const alt = computed(() => {
  const livr = data.livr[props.mode];
  const title = props.mode === 'static' ? 'Validator created once' : 'Validator created per call';
  const rivals = data[props.mode]
    .map(rival => `${rival.name} ${formatRatio(rival.simple)} slower`)
    .join(', ');
  return `${title}: LIVR ${formatOps(livr.simple)} operations per second on the simple form. ${rivals}.`;
});
</script>

<template>
  <figure class="benchmark-chart">
    <img
      :src="withBase(`/benchmark/latest-${props.mode}.svg`)"
      :alt="alt"
      width="780"
      height="440"
      loading="lazy"
    />
    <figcaption>
      Node.js {{ data.node.replace(/^v/, '') }}, {{ data.cpu.replace(/ \d+-Core Processor$/, '') }},
      {{ data.date }}. Absolute numbers depend on the hardware, compare the ratios.
    </figcaption>
  </figure>
</template>
