<script setup lang="ts">
// The rules reference lives on the specification site; most visitors look for it
defineProps<{ wide?: boolean }>();
</script>

<template>
  <a
    class="rules-card"
    :class="{ 'rules-card--wide': wide }"
    href="https://livr-spec.org/validation-rules.html"
    target="_blank"
    rel="noopener"
  >
    <span class="rules-card__title">All validation rules <span aria-hidden="true">↗︎</span></span>
    <span v-if="wide" class="rules-card__text">
      Every rule with its arguments, error codes and examples. Opens
      <strong>livr-spec.org</strong>, the site of the LIVR specification.
    </span>
    <span v-else class="rules-card__text">
      Arguments, error codes and examples. Opens <strong>livr-spec.org</strong>, the specification.
    </span>
  </a>
</template>
