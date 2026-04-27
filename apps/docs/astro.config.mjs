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
  'regional-engine',
  'sentry',
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
          label: 'الدروس التعليمية',
          autogenerate: { directory: 'tutorials' },
          translations: { en: 'Tutorials' },
        },
        {
          label: 'الأدلة الإرشادية',
          autogenerate: { directory: 'guides' },
          translations: { en: 'Guides' },
        },
        {
          label: 'المفاهيم',
          autogenerate: { directory: 'concepts' },
          translations: { en: 'Concepts' },
        },
        {
          label: 'دليل المستخدم',
          autogenerate: { directory: 'user-guide' },
          translations: { en: 'User Guide' },
        },
        // API Reference — one sidebar group per package
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
