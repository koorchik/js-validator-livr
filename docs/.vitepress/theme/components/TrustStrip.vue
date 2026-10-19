<script setup lang="ts">
// The number of languages: distinct `language` values in implementations.json of the spec site
const items = [
  { text: 'Maintained since 2013', link: '/why/proven' },
  { text: 'Built on the LIVR specification', link: 'https://livr-spec.org' },
  {
    text: 'Same rules in 11 languages',
    link: 'https://livr-spec.org/introduction/implementations.html',
  },
  {
    text: 'Passes the shared cross-language test suite',
    link: 'https://livr-spec.org/how-to-contribute/test-suite.html',
  },
];
</script>

<template>
  <ul class="trust-strip">
    <li v-for="item in items" :key="item.text">
      <a :href="item.link">{{ item.text }}</a>
    </li>
  </ul>
</template>
