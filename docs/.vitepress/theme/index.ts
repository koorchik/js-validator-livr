import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import { h } from 'vue';

import HeroDemo from './components/HeroDemo.vue';
import BenchmarkChart from './components/BenchmarkChart.vue';
import BenchmarkHighlights from './components/BenchmarkHighlights.vue';
import BenchmarkPair from './components/BenchmarkPair.vue';
import BenchmarkTable from './components/BenchmarkTable.vue';
import RulesCard from './components/RulesCard.vue';
import TrustStrip from './components/TrustStrip.vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(HeroDemo),
      'home-hero-after': () => h(TrustStrip),
      'sidebar-nav-before': () => h(RulesCard),
    });
  },
  enhanceApp({ app }) {
    app.component('BenchmarkChart', BenchmarkChart);
    app.component('BenchmarkHighlights', BenchmarkHighlights);
    app.component('BenchmarkPair', BenchmarkPair);
    app.component('BenchmarkTable', BenchmarkTable);
    app.component('RulesCard', RulesCard);
  },
} satisfies Theme;
