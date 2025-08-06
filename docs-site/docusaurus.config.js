// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Cvety.kz API Documentation',
  tagline: 'Complete API documentation for flower shop management system',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.cvety.kz',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'cvety-kz',
  projectName: 'api-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'kz', 'en'],
    localeConfigs: {
      ru: {
        label: 'Русский',
        direction: 'ltr',
        htmlLang: 'ru-RU',
        calendar: 'gregory',
      },
      kz: {
        label: 'Қазақша',
        direction: 'ltr',
        htmlLang: 'kk-KZ',
        calendar: 'gregory',
      },
      en: {
        label: 'English',
        direction: 'ltr',
        htmlLang: 'en-US',
        calendar: 'gregory',
      },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/cvety-kz/api-docs/tree/main/',
          remarkPlugins: [],
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/cvety-kz/api-docs/tree/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],
  
  markdown: {
    mermaid: true,
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
      navbar: {
        title: 'Cvety.kz API',
        logo: {
          alt: 'Cvety.kz Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            to: '/docs/api-reference',
            label: 'API Reference',
            position: 'left'
          },
          {
            to: '/docs/examples',
            label: 'Examples',
            position: 'left'
          },
          {
            to: '/blog',
            label: 'Changelog',
            position: 'left'
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/cvety-kz/api',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://api.cvety.kz/docs',
            label: 'Swagger UI',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/docs/intro',
              },
              {
                label: 'API Reference',
                to: '/docs/api-reference',
              },
              {
                label: 'Examples',
                to: '/docs/examples',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Telegram',
                href: 'https://t.me/cvety_kz_dev',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/cvety-kz',
              },
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/cvety-kz',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Changelog',
                to: '/blog',
              },
              {
                label: 'Status Page',
                href: 'https://status.cvety.kz',
              },
              {
                label: 'Support',
                href: 'mailto:dev@cvety.kz',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Cvety.kz. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['python', 'bash', 'json', 'javascript', 'typescript', 'php'],
      },
      algolia: {
        // The application ID provided by Algolia
        appId: 'YOUR_APP_ID',
        // Public API key: it is safe to commit it
        apiKey: 'YOUR_SEARCH_API_KEY',
        indexName: 'cvety_kz_docs',
        // Optional: see doc section below
        contextualSearch: true,
        // Optional: Algolia search parameters
        searchParameters: {},
        // Optional: path for search page that enabled by default (`false` to disable it)
        searchPagePath: 'search',
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      announcementBar: {
        id: 'api_v1_release',
        content:
          '🎉 API v1.0 is now available! Check out the <a href="/blog/api-v1-release">release notes</a>.',
        backgroundColor: '#fafbfc',
        textColor: '#091E42',
        isCloseable: true,
      },
    }),
};

module.exports = config;