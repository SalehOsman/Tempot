import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { createStarlightTypeDocPlugin } from 'starlight-typedoc';
import process from 'node:process';

/** Packages with public exports that need TypeDoc-generated API reference pages */
const typedocPackages = [
  'shared',
  'logger',
  'event-bus',
  'auth-core',
  'session-manager',
  'i18n-core',
  'database',
  'storage-engine',
  'ux-helpers',
  'ai-core',
  'input-engine',
  'settings',
  'module-registry',
  'national-id-parser',
  'regional-engine',
  'sentry',
  'cms-engine',
  'document-engine',
  'import-engine',
  'notifier',
  'search-engine',
];

const site = process.env.DOCS_SITE ?? 'https://salehosman.github.io/Tempot';

/**
 * Create a [plugin, sidebarGroup] tuple for each package.
 * Each plugin outputs to `reference/{name}/` and has its own sidebar section.
 */
const packagePlugins = typedocPackages.map((name) => {
  const [plugin, sidebar] = createStarlightTypeDocPlugin();
  return {
    name,
    sidebar,
    instance: plugin({
      entryPoints: [`../../packages/${name}/src/index.ts`],
      tsconfig: `../../packages/${name}/tsconfig.json`,
      output: `reference/${name}`,
      sidebar: { label: `@tempot/${name}`, collapsed: true },
    }),
  };
});

export default defineConfig({
  site,
  integrations: [
    starlight({
      title: 'Tempot Documentation',
      defaultLocale: 'ar',
      locales: {
        ar: { label: 'العربية', dir: 'rtl' },
        en: { label: 'English' },
      },
      sidebar: [
        {
          label: 'Start Here',
          autogenerate: { directory: 'start-here' },
        },
        {
          label: 'Governance',
          autogenerate: { directory: 'governance' },
        },
        {
          label: 'Architecture',
          autogenerate: { directory: 'architecture' },
        },
        {
          label: 'Development',
          autogenerate: { directory: 'development' },
        },
        {
          label: 'Modules',
          autogenerate: { directory: 'modules' },
        },
        {
          label: 'Packages',
          autogenerate: { directory: 'packages' },
        },
        {
          label: 'Operations',
          autogenerate: { directory: 'operations' },
        },
        {
          label: 'AI Context',
          autogenerate: { directory: 'ai-context' },
        },
        {
          label: 'Tutorials',
          autogenerate: { directory: 'tutorials' },
        },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
        {
          label: 'Concepts',
          autogenerate: { directory: 'concepts' },
        },
        {
          label: 'User Guide',
          autogenerate: { directory: 'user-guide' },
        },
        ...packagePlugins.map((p) => p.sidebar),
      ],
      plugins: packagePlugins.map((p) => p.instance),
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/SalehOsman/Tempot',
        },
      ],
    }),
  ],
});
