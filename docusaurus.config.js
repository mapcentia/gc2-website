// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)
const gaTrackingId = process.env.GA_TRACKING_ID;
const hasGaTracking = Boolean(gaTrackingId);

const webAppUrl = process.env.WEBAPP_URL ?? 'http://localhost:4000';

const stripeLinks = {
    personalMonthly: process.env.STRIPE_PERSONAL_MONTHLY ?? 'https://buy.stripe.com/test_4gM4gA5Z08ok2I8dYP8Zq01',
    personalYearly:  process.env.STRIPE_PERSONAL_YEARLY  ?? 'https://buy.stripe.com/test_aFaeVe9bc9so3Mcg6X8Zq02',
    proMonthly:      process.env.STRIPE_PRO_MONTHLY      ?? 'https://buy.stripe.com/test_6oUdRaevwbAwaaAcUL8Zq03',
    proYearly:       process.env.STRIPE_PRO_YEARLY       ?? 'https://buy.stripe.com/test_9B628sbjkbAw5UkcUL8Zq04',
}

/** @type {import('@docusaurus/types').Config} */
const config = {

    customFields: {stripeLinks, webAppUrl},

    title: 'GC2',
    tagline: 'Geo Compute Cloud — managed PostGIS in the cloud or self-hosted with Docker',
    favicon: 'img/gc2-logo.svg',

    // Set the production url of your site here
    url: 'https://gc2.io',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/',
    // Avoid duplicate content from both with/without trailing slash
    trailingSlash: false,

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'mapcentia', // Usually your GitHub org/user name.
    projectName: 'website', // Usually your repo name.

    onBrokenLinks: 'throw',
    markdown: {
        hooks: {
            onBrokenMarkdownLinks: 'warn',
        },
    },

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    plugins: [
        [
            '@docusaurus/plugin-client-redirects',
            {
                redirects: [
                    {
                        from: '/geospatial',
                        to: '/',
                    },
                    {
                        from: '/docs/vibe-coding',
                        to: '/docs/agentic-development',
                    },
                    {
                        from: '/docs/ogc',
                        to: '/docs/ogc/services',
                    },
                    {
                        from: '/docs/ogc-api',
                        to: '/docs/ogc/api',
                    },
                ],
            },
        ],
    ],

    presets: [
        [
            '@docusaurus/preset-classic',
            ({
                docs: {
                    sidebarPath: './sidebars.js',
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl: 'https://github.com/mapcentia/website/tree/main/',
                },
                blog: {
                    showReadingTime: true,
                    feedOptions: {
                        type: ['rss', 'atom'],
                        xslt: true,
                    },
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl:
                        'https://github.com/mapcentia/website/tree/main',
                    // Useful options to enforce blogging best practices
                    onInlineTags: 'warn',
                    onInlineAuthors: 'warn',
                    onUntruncatedBlogPosts: 'warn',
                },
                ...(hasGaTracking
                    ? {
                        gtag: {
                            trackingID: gaTrackingId,
                            anonymizeIP: true,
                        },
                    }
                    : {}),
                sitemap: {
                    lastmod: 'date',
                    changefreq: null,
                    priority: null,
                    filename: 'sitemap.xml',
                    ignorePatterns: ['/tags/**', '/__docusaurus/**'],
                },
                theme: {
                    customCss: './src/css/custom.css',
                },
            }),
        ],
    ],

    themeConfig:
        {
            image: 'img/social-card-geospatial.png',
            metadata: [
                {
                    name: 'description',
                    content: 'GC2 (Geo Compute Cloud) is a geospatial BaaS and infrastructure platform with PostGIS, data import, spatial SQL, realtime APIs and OGC WMS/WFS. Use managed cloud or self-host with Docker.'
                },
                {property: 'og:type', content: 'website'},
                {property: 'og:site_name', content: 'GC2'},
                {name: 'twitter:card', content: 'summary_large_image'},
            ],
            navbar: {
                title: 'GC2',
                logo: {
                    alt: 'GC2 logo',
                    src: 'img/gc2-logo.svg',
                    srcDark: 'img/gc2-logo-dark.svg',
                },
                items: [
                    {to: 'console', label: 'Console', position: 'left'},
                    {to: 'faq', label: 'FAQ', position: 'left'},
                    {
                        type: 'docSidebar',
                        sidebarId: 'tutorialSidebar',
                        position: 'left',
                        label: 'Docs',
                    },
                    {
                        href: 'https://api.gc2.io/swagger-ui/index.html',
                        label: 'Open API',
                        position: 'left',
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
                                label: 'Docs',
                                to: '/docs/intro',
                            },
                        ],
                    },
                    {
                        title: 'Community',
                        items: [
                            {
                                label: 'Stack Overflow',
                                href: 'https://stackoverflow.com/questions/tagged/gc2',
                            },
                        ],
                    },
                    {
                        title: 'More',
                        items: [
                            {
                                label: 'GitHub',
                                href: 'https://github.com/mapcentia/',
                            },
                        ],
                    }, {
                        title: 'Support',
                        items: [
                            {
                                label: 'E-mail',
                                href: 'mailto:info@mapcentia.com',
                            },
                        ],
                    },
                ],
                copyright: `Copyright © ${new Date().getFullYear()} MapCentia`,
            },
            prism: {
                theme: prismThemes.github,
                darkTheme: prismThemes.palenight,
                additionalLanguages: ['bash', 'diff', 'json', 'powershell', 'http']
            },
        },
    scripts: [{src: 'https://js.stripe.com/v3/pricing-table.js', defer: true, 'data-domain': 'localhost:4000'}],
};

export default config;
