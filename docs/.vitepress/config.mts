import fs from 'node:fs';
import { defineConfig, type DefaultTheme } from 'vitepress';

const pkg = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

const SITE_URL = 'https://js.livr-spec.org';
const REPO_URL = 'https://github.com/koorchik/js-validator-livr';
const SPEC_URL = 'https://livr-spec.org';
// The rules reference of the specification: most visitors look for it
const RULES_URL = `${SPEC_URL}/validation-rules.html`;
const DESCRIPTION =
  'LIVR for JavaScript and TypeScript: validation rules that are just data, the fastest validator in the benchmarks, zero dependencies and type inference from the schema.';

// Anchors like on GitHub (`one_of` keeps its underscore), so DESIGN.md and TYPESCRIPT.md links
// work the same on the site and in the repository
function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

// One sidebar for all pages, so the whole menu stays visible everywhere
const sidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Guide',
    items: [
      { text: 'Getting started', link: '/guide/getting-started' },
      { text: 'Usage', link: '/guide/usage' },
      { text: 'Custom rules', link: '/guide/custom-rules' },
      { text: 'Built-in rules', link: '/rules' },
    ],
  },
  {
    text: 'Reference',
    items: [
      { text: 'TypeScript', link: '/typescript' },
      { text: 'API', link: '/api' },
      { text: 'Changelog', link: '/changelog' },
    ],
  },
  {
    text: 'Why LIVR',
    items: [
      { text: 'Rules are just data', link: '/why/schemas-are-data' },
      { text: 'Performance', link: '/why/performance' },
      { text: 'Type inference', link: '/why/type-inference' },
      { text: 'Zero dependencies', link: '/why/zero-dependencies' },
      { text: 'Proven by 13 years and a spec', link: '/why/proven' },
      { text: 'All design decisions', link: '/why/design-decisions' },
    ],
  },
];

export default defineConfig({
  lang: 'en-US',
  title: 'LIVR for JavaScript',
  titleTemplate: ':title · LIVR for JavaScript',
  description: DESCRIPTION,

  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: SITE_URL },

  // DESIGN.md and TYPESCRIPT.md keep their names, links to them on GitHub and npm keep working
  rewrites: {
    'DESIGN.md': 'why/design-decisions.md',
    'TYPESCRIPT.md': 'typescript.md',
  },
  srcExclude: ['scripts/**'],

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico', sizes: '32x32' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
    ['meta', { name: 'theme-color', content: '#f7df1e' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'LIVR for JavaScript' }],
    ['meta', { property: 'og:image', content: `${SITE_URL}/og-image.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  transformPageData(pageData) {
    const title = pageData.frontmatter.title ?? pageData.title;
    const description = pageData.frontmatter.description ?? DESCRIPTION;
    const pagePath = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      [
        'meta',
        { property: 'og:title', content: title ? `${title} · LIVR for JavaScript` : 'LIVR' },
      ],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: `${SITE_URL}/${pagePath}` }],
      ['link', { rel: 'canonical', href: `${SITE_URL}/${pagePath}` }]
    );
  },

  markdown: {
    anchor: { slugify },
  },

  vite: {
    define: {
      __LIVR_VERSION__: JSON.stringify(pkg.version),
    },
  },

  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo-dark.svg', alt: 'LIVR' },
    siteTitle: 'for <span class="js-badge">JavaScript</span>',

    nav: [
      {
        text: 'Why LIVR',
        activeMatch: '^/why/',
        items: [
          { text: 'Rules are just data', link: '/why/schemas-are-data' },
          { text: 'Performance', link: '/why/performance' },
          { text: 'Type inference', link: '/why/type-inference' },
          { text: 'Zero dependencies', link: '/why/zero-dependencies' },
          { text: 'Proven by 13 years and a spec', link: '/why/proven' },
          { text: 'All design decisions', link: '/why/design-decisions' },
        ],
      },
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '^/(guide/|rules)' },
      { text: 'TypeScript', link: '/typescript' },
      { text: 'API', link: '/api' },
      { text: 'All rules', link: RULES_URL },
      {
        text: `v${pkg.version}`,
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'LIVR specification', link: SPEC_URL },
          { text: 'npm', link: 'https://www.npmjs.com/package/livr' },
          { text: 'livr-extra-rules', link: 'https://www.npmjs.com/package/livr-extra-rules' },
          { text: 'Playground', link: `${SPEC_URL}/playground.html` },
        ],
      },
    ],

    sidebar,

    socialLinks: [{ icon: 'github', link: REPO_URL }],

    editLink: {
      pattern: `${REPO_URL}/edit/master/docs/:path`,
      text: 'Edit this page on GitHub',
    },

    search: { provider: 'local' },

    outline: { level: [2, 3] },

    footer: {
      message: `Released under the MIT License. Built on the <a href="${SPEC_URL}">LIVR specification</a>.`,
    },
  },
});
