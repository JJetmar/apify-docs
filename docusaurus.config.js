const { join } = require('path');
const { config } = require('./apify-docs-theme');
const { externalLinkProcessor } = require('./tools/utils/externalLink');
const { collectSlugs } = require('./tools/utils/collectSlugs');

/** @type {Partial<import('@docusaurus/types').DocusaurusConfig>} */
module.exports = {
    title: 'Apify Documentation',
    tagline: 'Apify Documentation',
    url: config.absoluteUrl,
    baseUrl: '/',
    trailingSlash: false,
    organizationName: 'apify',
    projectName: 'apify-docs',
    scripts: ['/js/custom.js'],
    favicon: 'img/favicon.svg',
    onBrokenLinks:
    /** @type {import('@docusaurus/types').ReportingSeverity} */ ('throw'),
    onBrokenMarkdownLinks:
    /** @type {import('@docusaurus/types').ReportingSeverity} */ ('throw'),
    themes: [
        [
            require.resolve('./apify-docs-theme'),
            /** @type {import('./apify-docs-theme/types').ThemeOptions} */
            ({
                subNavbar: {
                    title: 'Academy',
                    pathRegex: '/academy',
                    to: '/academy',
                    items: [
                        {
                            label: 'Courses',
                            to: `/academy`,
                            activeBaseRegex: `${[
                                'academy$',
                                ...collectSlugs(join(__dirname, 'sources', 'academy', 'webscraping')),
                                ...collectSlugs(join(__dirname, 'sources', 'academy', 'platform')),
                            ].join('$|')}$`,
                        },
                        {
                            label: 'Tutorials',
                            to: `/academy/tutorials`,
                            activeBaseRegex: `${collectSlugs(join(__dirname, 'sources', 'academy', 'tutorials')).join('$|')}$`,
                        },
                        {
                            label: 'Glossary',
                            to: `/academy/glossary`,
                            activeBaseRegex: `${collectSlugs(join(__dirname, 'sources', 'academy', 'glossary')).join('$|')}$`,
                        },
                    ],
                },
            }),
        ],
        '@docusaurus/theme-mermaid',
    ],
    presets: /** @type {import('@docusaurus/types').PresetConfig[]} */ ([
        [
            '@docusaurus/preset-classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    id: 'platform',
                    // Docusaurus shows the author and date of last commit to entire repo, which doesn't make sense,
                    // so let's just disable showing author and last modification
                    showLastUpdateAuthor: false,
                    showLastUpdateTime: false,
                    editUrl: 'https://github.com/apify/apify-docs/edit/master/',
                    path: './sources/platform',
                    routeBasePath: 'platform',
                    sidebarPath: require.resolve('./sources/platform/sidebars.js'),
                    rehypePlugins: [externalLinkProcessor],
                },
                sitemap: {
                    filename: 'sitemap_base.xml',
                },
            }),
        ],
    ]),
    plugins: [
        [
            '@docusaurus/plugin-content-docs',
            {
                id: 'academy',
                path: './sources/academy',
                routeBasePath: 'academy',
                rehypePlugins: [externalLinkProcessor],
                // Docusaurus shows the author and date of last commit to entire repo, which doesn't make sense,
                // so let's just disable showing author and last modification
                showLastUpdateAuthor: false,
                showLastUpdateTime: false,
                editUrl: 'https://github.com/apify/apify-docs/edit/master/',
                sidebarPath: require.resolve('./sources/academy/sidebars.js'),
            },
        ],
        () => ({
            configureWebpack() {
                return {
                    module: {
                        rules: [
                            {
                                test: /@apify-packages\/ui-components\/.*/,
                                resolve: {
                                    fullySpecified: false,
                                },
                                loader: 'babel-loader',
                            },
                        ],
                    },
                };
            },
        }),
        // TODO this should be somehow computed from all the external sources
        // [
        //     '@docusaurus/plugin-client-redirects',
        //     {
        //         createRedirects(existingPath) {
        //             if (!existingPath.endsWith('/')) {
        //                 return `${existingPath}/`;
        //             }
        //
        //             return undefined; // Return a falsy value: no redirect created
        //         },
        //     },
        // ],
        ...config.plugins,
    ],
    markdown: {
        mermaid: true,
    },
    themeConfig: config.themeConfig,
    staticDirectories: ['apify-docs-theme/static', 'static'],
};
