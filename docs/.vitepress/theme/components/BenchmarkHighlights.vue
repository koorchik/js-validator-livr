<script setup lang="ts">
import { data } from '../../data/benchmark.data';
import { formatOps, formatRatio } from '../format';

// LIVR against the next fastest validator, and against Zod and the slowest one per call
const closest = data.static[0];
const zodDynamic = data.dynamic.find(rival => rival.name === 'Zod');
const slowestDynamic = data.dynamic[data.dynamic.length - 1];
const slowestLabel = `${formatRatio(slowestDynamic.simple)} faster than ${slowestDynamic.name}`;
</script>

<template>
  <div class="stat-tiles">
    <div class="stat-tile">
      <div class="stat-tile__value">{{ formatOps(data.livr.static.simple) }}</div>
      <div class="stat-tile__label">validations per second of a simple form, on one core</div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile__value">{{ formatRatio(closest.simple) }}</div>
      <div class="stat-tile__label">
        faster than {{ closest.name }}, the next fastest, with a validator created once
      </div>
    </div>
    <div v-if="zodDynamic" class="stat-tile">
      <div class="stat-tile__value">{{ formatRatio(zodDynamic.simple) }}</div>
      <div class="stat-tile__label">
        faster than Zod with a validator created per call ({{ slowestLabel }})
      </div>
    </div>
  </div>
</template>
