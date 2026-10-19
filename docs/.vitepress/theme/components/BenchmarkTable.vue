<script setup lang="ts">
import { data } from '../../data/benchmark.data';
import { formatOps, formatRatio } from '../format';

const rows = data.static
  .map(rival => ({ ...rival, dynamic: data.dynamic.find(other => other.name === rival.name)! }))
  .sort((a, b) => a.dynamic.simple - b.dynamic.simple);
</script>

<template>
  <table class="benchmark-table">
    <thead>
      <tr>
        <th rowspan="2">Validator</th>
        <th colspan="2">Created once</th>
        <th colspan="2">Created per call</th>
      </tr>
      <tr>
        <th>Simple form</th>
        <th>Nested object</th>
        <th>Simple form</th>
        <th>Nested object</th>
      </tr>
    </thead>
    <tbody>
      <tr class="benchmark-table__livr">
        <td><strong>LIVR</strong> {{ data.livrVersion }}</td>
        <td>{{ formatOps(data.livr.static.simple) }} ops/s</td>
        <td>{{ formatOps(data.livr.static.nested) }} ops/s</td>
        <td>{{ formatOps(data.livr.dynamic.simple) }} ops/s</td>
        <td>{{ formatOps(data.livr.dynamic.nested) }} ops/s</td>
      </tr>
      <tr v-for="row in rows" :key="row.name">
        <td>{{ row.name }} {{ row.version }}</td>
        <td>{{ formatRatio(row.simple) }} slower</td>
        <td>{{ formatRatio(row.nested) }} slower</td>
        <td>{{ formatRatio(row.dynamic.simple) }} slower</td>
        <td>{{ formatRatio(row.dynamic.nested) }} slower</td>
      </tr>
    </tbody>
  </table>
</template>
