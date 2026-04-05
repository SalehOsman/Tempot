import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
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
      ],
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
