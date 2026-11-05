import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import {trackCtaClick} from '../utils/analytics';
import CodeShowcase from '@site/src/components/HomepageCode';
import styles from './index.module.css';

const pageTitle = 'Geospatial BaaS & Infrastructure — Cloud or Self-Hosted';
const pageDescription =
    'Build geospatial apps on PostGIS with spatial SQL, realtime APIs, OGC API Features & Maps, WMS/WFS, scheduled imports and GeoParquet snapshots. Use managed GC2 Cloud or self-host with Docker.';

const formats = ['GeoParquet', 'GeoJSON', 'Shapefile', 'GeoPackage', 'FlatGeobuf', 'CSV', 'GML', 'MapInfo', 'File Geodatabase'];

const steps = [
    {
        marker: '01',
        title: 'Upload your data',
        description:
            'Import GeoParquet, GeoJSON, Shapefile, GeoPackage, FlatGeobuf, CSV, GML, MapInfo or File Geodatabase into PostGIS tables, with options for coordinate reference systems and reprojection.',
        link: {to: '/docs/import', label: 'File import'},
    },
    {
        marker: '02',
        title: 'Get instant APIs',
        description:
            'Query with parameterized SQL over REST or WebSocket and auto-generated GraphQL. Publish layers through OGC API Features & Maps and WMS/WFS.',
        link: {to: '/docs/statement', label: 'SQL API'},
    },
    {
        marker: '03',
        title: 'Build your app',
        description:
            'TypeScript SDK with OAuth helpers, realtime subscriptions with server-side filtering, and fine-grained access control.',
        link: {to: '/docs/sdk', label: 'SDK'},
    },
];

const features = [
    {
        icon: '⌖',
        title: 'PostGIS built in',
        description:
            'Find nearby features with ST_DWithin, intersect geometries with ST_Intersects, and transform coordinates with spatial SQL.',
        link: {to: '/docs/statement', label: 'Explore spatial SQL'},
    },
    {
        icon: '⛁',
        title: 'Import your spatial data',
        description: 'Bring GeoParquet, GeoJSON, Shapefile, GeoPackage, FlatGeobuf, CSV or GML into your database and expose it through APIs.',
        link: {to: '/docs/import', label: 'Explore data import'},
    },
    {
        icon: '⏲',
        title: 'Scheduled imports',
        description:
            'Keep tables in sync with files, WFS services and feeds on a cron schedule. Imports are atomic, runs are tracked, and a snapshot can be queued after each one.',
        link: {to: '/docs/scheduler', label: 'Explore the scheduler'},
    },
    {
        icon: '⧉',
        title: 'Snapshots as GeoParquet',
        description:
            'Export tables as dated GeoParquet or FlatGeobuf files with a STAC catalog, and query them straight from DuckDB, Python or a web map over HTTP range requests.',
        link: {to: '/docs/snapshots', label: 'Explore snapshots'},
    },
    {
        icon: '▦',
        title: 'OGC APIs & map services',
        description:
            'Read GeoJSON with OGC API Features, render images with OGC API Maps, and connect GIS tools through WMS/WFS. Edit features via WFS-T.',
        link: {to: '/docs/ogc/api', label: 'Explore the OGC API'},
    },
    {
        icon: '⬡',
        title: 'GraphQL, auto-generated',
        description: 'Queries, mutations and subscriptions derived from your schema.',
    },
    {
        icon: '⇄',
        title: 'Realtime over WebSocket',
        description: 'Subscribe to table changes with server-side filtering (shapes).',
    },
    {
        icon: '⚿',
        title: 'Control access to your data',
        description:
            'OAuth 2.0 (PKCE, password, device flows), sub-users, table-level privileges and SQL rules.',
    },
    {
        icon: '✳',
        title: 'AI-agent ready',
        description: 'Connect AI assistants to inspect schemas, query spatial data and manage your backend through the official MCP server.',
        link: {to: '/docs/agentic-development', label: 'Connect AI agents'},
    },
    {
        icon: '⌘',
        title: 'Functions for your workflows',
        description: 'Run Node.js or Python code on demand, on a schedule, or in response to events, with access to your data.',
        link: {to: '/docs/functions', label: 'Explore functions'},
    },
    {
        icon: '◍',
        title: 'Open source roots',
        description:
            'Built on Geocloud2 (AGPLv3) by MapCentia, with 10+ years of geospatial domain expertise.',
        link: {to: '/docs/opensource', label: 'Explore the open source stack'},
    },
];

const useCases = [
    {
        title: 'Web maps with live data',
        description: 'Realtime layers without building a sync pipeline.',
    },
    {
        title: 'Field data collection',
        description: 'Upload from the field, query from the office.',
    },
    {
        title: 'Open data portals',
        description: 'Publish spatial datasets as queryable APIs.',
    },
    {
        title: 'GIS + AI workflows',
        description: 'Let agents query and manage spatial data via MCP.',
    },
    {
        title: 'Desktop GIS integration',
        description: 'Connect QGIS directly over WMS/WFS and edit with WFS-T.',
    },
    {
        title: 'Analytics on dated snapshots',
        description: 'Query GeoParquet exports in DuckDB and compare how a dataset looked on any date.',
    },
    {
        title: 'Location-based applications',
        description: 'Find nearby places, intersect service areas and build spatial queries into your app.',
    },
];

const ogcExample = `# Read a collection as GeoJSON (OGC API Features)
GET https://api.gc2.io/api/v4/ogc/database/mydb/collections/parks.areas/items?limit=10 HTTP/1.1
Accept: application/geo+json
Authorization: Bearer your-access-token

# Render a styled map image (OGC API Maps)
GET https://api.gc2.io/api/v4/ogc/database/mydb/collections/parks.areas/map?width=1024&f=png HTTP/1.1
Accept: image/png
Authorization: Bearer your-access-token`;

function HeroMap() {
    return (
        <div className={styles.heroArt} aria-hidden="true">
            <svg className={styles.heroMap} viewBox="0 0 480 360" role="presentation">
                {/* graticule */}
                <g className={styles.graticule}>
                    {[60, 120, 180, 240, 300, 360, 420].map((x) => (
                        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="360" />
                    ))}
                    {[60, 120, 180, 240, 300].map((y) => (
                        <line key={`h${y}`} x1="0" y1={y} x2="480" y2={y} />
                    ))}
                </g>
                {/* park polygons */}
                <g className={styles.polygons}>
                    <polygon points="48,210 112,168 176,196 162,268 84,282" />
                    <polygon points="262,52 348,38 396,96 342,150 270,128" />
                    <polygon points="330,220 414,196 452,260 398,318 326,296" />
                </g>
                {/* ST_DWithin radius */}
                <circle className={styles.queryRadius} cx="216" cy="172" r="92" />
                <circle className={styles.queryPoint} cx="216" cy="172" r="6" />
                {/* feature points */}
                <g className={styles.points}>
                    <circle cx="140" cy="226" r="4" />
                    <circle cx="296" cy="108" r="4" />
                    <circle cx="252" cy="218" r="4" />
                    <circle cx="372" cy="252" r="4" />
                    <circle cx="96" cy="96" r="4" />
                </g>
            </svg>
            <pre className={styles.heroResponse}>
{`{ "name": "Nørrebroparken",
  "distance_m": 420 }`}
            </pre>
        </div>
    );
}

export default function Home() {
    return (
        <Layout title={pageTitle} description={pageDescription}>
            <Head>
                <link rel="canonical" href="https://gc2.io/" />
                <meta property="og:title" content={`${pageTitle} | GC2`} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:image" content="https://gc2.io/img/social-card-geospatial.png" />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:url" content="https://gc2.io/" />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${pageTitle} | GC2`} />
                <meta name="twitter:description" content={pageDescription} />
                <meta name="twitter:image" content="https://gc2.io/img/social-card-geospatial.png" />
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Organization',
                        name: 'GC2',
                        url: 'https://gc2.io/',
                        logo: 'https://gc2.io/img/gc2-logo.svg',
                        sameAs: [
                            'https://github.com/mapcentia/',
                            'https://stackoverflow.com/questions/tagged/gc2'
                        ]
                    })}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: 'GC2',
                        applicationCategory: 'DeveloperApplication',
                        operatingSystem: 'Web',
                        description: pageDescription,
                        url: 'https://gc2.io/',
                        offers: {
                            '@type': 'Offer',
                            price: '0',
                            priceCurrency: 'USD',
                        },
                    })}
                </script>
            </Head>

            <div className={styles.page}>
                <header className={styles.hero}>
                    <div className={clsx('container', styles.heroInner)}>
                        <div className={styles.heroCopy}>
                            <p className={styles.kicker}>Geospatial BaaS &amp; infrastructure</p>
                            <Heading as="h1" className={styles.heroTitle}>
                                The backend for your geospatial applications
                            </Heading>
                            <p className={styles.heroSubtitle}>
                                From spatial data to working APIs. GC2 (Geo Compute Cloud) brings together
                                PostGIS, data import, spatial SQL, realtime APIs and OGC map
                                services in one geospatial backend as a service. Build on
                                managed <strong>GC2 Cloud</strong> or run the platform on
                                your own infrastructure with <strong>Docker</strong>.
                            </p>
                            <div className={styles.ctaButtons}>
                                <Link
                                    className="button button--primary button--lg"
                                    to="/console"
                                    onClick={() =>
                                        trackCtaClick('cta_cloud_start_click', {location: 'home_hero'})
                                    }
                                >
                                    Start in GC2 Cloud
                                </Link>
                                <Link
                                    className="button button--secondary button--lg"
                                    to="/docs/opensource"
                                    onClick={() =>
                                        trackCtaClick('cta_self_host_click', {location: 'home_hero'})
                                    }
                                >
                                    Self-host with Docker
                                </Link>
                                <Link
                                    className={styles.docsGhostLink}
                                    to="/docs/import"
                                    onClick={() =>
                                        trackCtaClick('cta_import_demo_click', {location: 'home_hero'})
                                    }
                                >
                                    Explore data import →
                                </Link>
                            </div>
                            <ul className={styles.formatPills} aria-label="Supported import formats">
                                {formats.map((format) => (
                                    <li key={format}>{format}</li>
                                ))}
                            </ul>
                            <p className={styles.heroTrust}>
                                Open source (AGPLv3)
                                <span aria-hidden="true"> · </span>
                                <Link
                                    to="https://github.com/mapcentia"
                                    onClick={() => trackCtaClick('cta_github_click', {location: 'home_hero'})}
                                >
                                    GitHub
                                </Link>
                                <span aria-hidden="true"> · </span>
                                PostgreSQL + PostGIS
                            </p>
                        </div>
                        <HeroMap />
                    </div>
                </header>

                <main>
                    <section className={styles.section}>
                        <div className="container">
                            <Heading as="h2" className={styles.sectionTitle}>
                                From spatial data to API in three steps
                            </Heading>
                            <div className={styles.steps}>
                                {steps.map((step) => (
                                    <div key={step.marker} className={styles.step}>
                                        <span className={styles.stepMarker}>{step.marker}</span>
                                        <Heading as="h3">{step.title}</Heading>
                                        <p>{step.description}</p>
                                        <Link to={step.link.to} className={styles.stepLink}>
                                            {step.link.label} →
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className={clsx(styles.section, styles.sectionAlt)}>
                        <div className="container">
                            <Heading as="h2" className={styles.sectionTitle}>
                                Built for geospatial work, end to end
                            </Heading>
                            <div className={styles.featureGrid}>
                                {features.map((feature) => (
                                    <div key={feature.title} className={styles.featureCard}>
                                        <span className={styles.featureIcon} aria-hidden="true">
                                            {feature.icon}
                                        </span>
                                        <Heading as="h3">{feature.title}</Heading>
                                        <p>{feature.description}</p>
                                        {feature.link && (
                                            <Link to={feature.link.to} className={styles.stepLink}>
                                                {feature.link.label} →
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <div className={clsx('container', styles.codeSection)}>
                            <div className={styles.codeCopy}>
                                <Heading as="h2" className={styles.sectionTitle}>
                                    Query spatial data. Connect your stack.
                                </Heading>
                                <p>
                                    Run PostGIS queries over REST or WebSocket, or use the
                                    TypeScript SDK with built-in OAuth helpers. Bind values
                                    with named parameters such as <code>:lng</code>,{' '}
                                    <code>:lat</code> and <code>:radius</code> to find nearby
                                    features without building your own API server.
                                </p>
                                <Link to="/docs/statement" className={styles.stepLink}>
                                    Read the SQL API docs →
                                </Link>
                                <br />
                                <Link to="/docs/sdk" className={styles.stepLink}>
                                    Build with the TypeScript SDK →
                                </Link>
                            </div>
                            <div className={styles.codeBlock}>
                                <CodeShowcase />
                            </div>
                        </div>
                    </section>

                    <section className={clsx(styles.section, styles.sectionAlt)}>
                        <div className={clsx('container', styles.codeSection)}>
                            <div className={styles.codeCopy}>
                                <Heading as="h2" className={styles.sectionTitle}>
                                    Open standards: OGC API, WMS &amp; WFS
                                </Heading>
                                <p>
                                    Browse collections and read GeoJSON through <strong>OGC API
                                    Features</strong>, or render styled map images with <strong>OGC
                                    API Maps</strong>. Filter features by bounding box, page through
                                    results and choose a supported coordinate reference system.
                                    The OGC API provides read-only REST access to your published
                                    layers, with the same privileges and geofence rules as WMS/WFS.
                                </p>
                                <p>
                                    Connect QGIS, OpenLayers, Leaflet and other GIS clients through
                                    WMS/WFS, and edit features through WFS-T. Configure map styling
                                    with classes, styles and labels through the Layer API.
                                </p>
                                <Link to="/docs/ogc/api" className={styles.stepLink}>
                                    Read the OGC API Features &amp; Maps docs →
                                </Link>
                                <br />
                                <Link to="/docs/ogc/services" className={styles.stepLink}>
                                    Read the WMS/WFS services docs →
                                </Link>
                                <br />
                                <Link to="/docs/layer/layers" className={styles.stepLink}>
                                    Style layers with the Layer API →
                                </Link>
                            </div>
                            <div className={styles.codeBlock}>
                                <CodeBlock language="http">{ogcExample}</CodeBlock>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <div className="container">
                            <Heading as="h2" className={styles.sectionTitle}>
                                What developers build on GC2
                            </Heading>
                            <div className={styles.useCaseGrid}>
                                {useCases.map((useCase) => (
                                    <div key={useCase.title} className={styles.useCaseCard}>
                                        <Heading as="h3">{useCase.title}</Heading>
                                        <p>{useCase.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className={clsx(styles.section, styles.sectionAlt)}>
                        <div className="container">
                            <Heading as="h2" className={styles.sectionTitle}>
                                Your geospatial platform. Your choice of deployment.
                            </Heading>
                            <div className={styles.deploymentGrid}>
                                <div className={styles.deploymentCard}>
                                    <p className={styles.kicker}>Managed geospatial BaaS</p>
                                    <Heading as="h3">Build on GC2 Cloud</Heading>
                                    <p>
                                        Start with a managed PostGIS backend. Import your data
                                        and connect your apps and GIS tools while GC2 handles
                                        the infrastructure.
                                    </p>
                                    <ul>
                                        <li>Managed PostgreSQL and PostGIS</li>
                                        <li>Data APIs, OGC services and authentication</li>
                                        <li>Free during beta — <Link to="/faq">see limits in the FAQ</Link></li>
                                    </ul>
                                    <Link
                                        className="button button--primary"
                                        to="/console"
                                        onClick={() => trackCtaClick('cta_cloud_start_click', {location: 'home_deployment'})}
                                    >
                                        Start in GC2 Cloud
                                    </Link>
                                </div>
                                <div className={styles.deploymentCard}>
                                    <p className={styles.kicker}>Geospatial infrastructure</p>
                                    <Heading as="h3">Run it on your infrastructure</Heading>
                                    <p>
                                        Deploy the open source stack with Docker Compose.
                                        Keep control of your runtime, networking and data
                                        environment, from local development to production.
                                    </p>
                                    <ul>
                                        <li>App, WebSockets, PostGIS and Redis</li>
                                        <li>Your servers and deployment environment</li>
                                        <li>Open source under AGPLv3</li>
                                    </ul>
                                    <Link
                                        className="button button--secondary"
                                        to="/docs/opensource"
                                        onClick={() => trackCtaClick('cta_self_host_click', {location: 'home_deployment'})}
                                    >
                                        Explore self-hosting
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className={styles.finalCta}>
                        <div className="container">
                            <Heading as="h2">Build your next geospatial application</Heading>
                            <p>
                                Bring your spatial data. Start with managed cloud or deploy
                                the platform yourself, then connect your maps, apps and GIS tools.
                            </p>
                            <div className={styles.ctaButtons}>
                                <Link
                                    className="button button--secondary button--lg"
                                    to="/console"
                                    onClick={() =>
                                        trackCtaClick('cta_cloud_start_click', {location: 'home_bottom'})
                                    }
                                >
                                    Start in GC2 Cloud
                                </Link>
                                <Link
                                    className={clsx('button', 'button--lg', styles.ctaGhost)}
                                    to="/docs/start"
                                    onClick={() =>
                                        trackCtaClick('cta_docs_start_click', {location: 'home_bottom'})
                                    }
                                >
                                    Explore the docs
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </Layout>
    );
}
