<script setup lang="ts">
import { data } from '../../data/benchmark.data';
import { formatOps, formatRatio } from '../format';

// A validator created per call is the case of rules built at runtime
const microseconds = (1e6 / data.livr.dynamic.simple).toFixed(1);
const zodDynamic = data.dynamic.find(rival => rival.name === 'Zod');
const slowestDynamic = data.dynamic[data.dynamic.length - 1];
const slowestLabel = `${formatRatio(slowestDynamic.simple)} faster than ${slowestDynamic.name}`;
</script>

<template>
  <div class="stat-tiles">
    <div class="stat-tile">
      <div class="stat-tile__value">{{ formatOps(data.livr.static.simple) }}</div>
      <div class="stat-tile__label">
        validations per second of a form with rules fixed in code, on one core
      </div>
    </div>
    <div class="stat-tile">
      <div class="stat-tile__value">{{ microseconds }} µs</div>
      <div class="stat-tile__label">
        to create a validator from JSON rules and validate a form: rules built at runtime cost
        almost nothing
      </div>
    </div>
    <div v-if="zodDynamic" class="stat-tile">
      <div class="stat-tile__value">{{ formatRatio(zodDynamic.simple) }}</div>
      <div class="stat-tile__label">
        faster than Zod when rules are built at runtime ({{ slowestLabel }})
      </div>
    </div>
  </div>
</template>
