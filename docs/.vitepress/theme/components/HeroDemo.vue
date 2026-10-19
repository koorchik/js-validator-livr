<script setup lang="ts">
import { data } from '../../data/hero.data';
import { highlight } from '../highlight';

// Checked by tsc in the verification of the site: InferFromSchema of the schema with `as const`
const inferred = `{ email: string; age: number; role?: 'admin' | 'user' }`;
</script>

<template>
  <div
    class="hero-demo"
    aria-label="Example: a LIVR schema, input data, the validated output and the inferred TypeScript type"
  >
    <div class="hero-demo__window">
      <div class="hero-demo__dots" aria-hidden="true"><span /><span /><span /></div>
      <section>
        <h4>schema <span class="livr-badge livr-badge--brand">plain data</span></h4>
        <pre><code v-html="highlight(data.schema)" /></pre>
      </section>
      <section>
        <h4>input</h4>
        <pre><code v-html="highlight(data.input)" /></pre>
      </section>
      <section>
        <h4>output <span class="livr-badge livr-badge--ok">Valid</span></h4>
        <pre><code v-html="highlight(data.output)" /></pre>
      </section>
      <section>
        <h4>type <code>InferFromSchema&lt;typeof schema&gt;</code></h4>
        <pre><code v-html="highlight(inferred)" /></pre>
      </section>
    </div>
  </div>
</template>
