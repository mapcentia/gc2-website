import React, { useState } from 'react';
import clsx from 'clsx';
import CodeBlock from '@theme/CodeBlock';
import { trackCtaClick } from '../../utils/analytics';
import styles from './styles.module.css';

const codeSnippets = [
    {
        id: 'sdk',
        label: 'JS / TS SDK',
        language: 'typescript',
        code: `import { PasswordFlow, Sql } from '@mapcentia/gc2-sdk';

// Sign in once — the SDK stores and refreshes tokens for you
await new PasswordFlow({
  host: 'https://api.gc2.io',
  clientId: 'your-client-id',
  username: 'your-username',
  password: process.env.CENTIA_PASSWORD,
  database: 'your-database',
}).signIn();

// Parameterized spatial SQL on PostgreSQL + PostGIS
const { data } = await new Sql().exec({
  q: \`select name, st_asgeojson(geom) as location
      from places
      where st_dwithin(geom::geography,
        st_setsrid(st_makepoint(:lng, :lat), 4326)::geography, :radius)\`,
  params: { lng: 12.5683, lat: 55.6761, radius: 2000 },
});`,
    },
    {
        id: 'mcp',
        label: 'AI Agent (MCP)',
        language: 'json',
        code: `{
  "mcpServers": {
    "gc2": {
      "command": "npx",
      "args": ["-y", "@mapcentia/gc2-mcp-server"],
      "env": {
        "API_TOKEN": "your-access-token",
        "API_BASE_URL": "https://api.gc2.io"
      }
    }
  }
}`,
    },
    {
        id: 'sql',
        label: 'Spatial SQL',
        language: 'sql',
        code: `-- POST your SQL to /api/v4/sql with named parameters
SELECT
  name, 
  category,
  ST_Distance(
    geom::geography, 
    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
  ) AS distance_meters
FROM locations
WHERE ST_DWithin(
  geom::geography,
  ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
  :radius
)
ORDER BY distance_meters ASC
LIMIT 10;`,
    },
    {
        id: 'ogc',
        label: 'OGC (WMS/WFS)',
        language: 'bash',
        code: `# Every layer is served through standard OGC services

# Render a styled map image (WMS GetMap)
https://api.gc2.io/api/v4/ows/schema/parks/database/mydb
  ?SERVICE=WMS&VERSION=1.1.0&REQUEST=GetMap
  &LAYERS=parks.areas&SRS=EPSG:3857
  &BBOX=1204164,7485240,1259200,7534200
  &WIDTH=1024&HEIGHT=768&FORMAT=image/png

# Fetch the vector features (WFS GetFeature)
https://api.gc2.io/api/v4/wfs/schema/parks/database/mydb
  ?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature
  &TYPENAME=areas&SRSNAME=EPSG:4326

# Works with QGIS, OpenLayers, Leaflet — WFS-T for editing`,
    },
    {
        id: 'docker',
        label: 'Self-Host',
        language: 'bash',
        code: `# Self-host the full stack: app, WebSockets, PostGIS and Redis
git clone https://github.com/mapcentia/gc2-docker.git
cd gc2-docker
docker compose up --build -d

# Connect with the CLI
npm install -g @mapcentia/gc2-cli
gc2 connect http://localhost:81
gc2 login`,
    },
];

export default function CodeShowcase() {
    const [activeTab, setActiveTab] = useState('sql');

    const selectTab = (id) => {
        setActiveTab(id);
        trackCtaClick('hero_code_tab_click', { tab: id });
    };

    const handleTabKeyDown = (event) => {
        const currentIndex = codeSnippets.findIndex((s) => s.id === activeTab);
        let nextIndex = null;
        if (event.key === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % codeSnippets.length;
        } else if (event.key === 'ArrowLeft') {
            nextIndex = (currentIndex - 1 + codeSnippets.length) % codeSnippets.length;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = codeSnippets.length - 1;
        }
        if (nextIndex !== null) {
            event.preventDefault();
            selectTab(codeSnippets[nextIndex].id);
            event.currentTarget
                .closest('[role="tablist"]')
                ?.querySelectorAll('[role="tab"]')[nextIndex]
                ?.focus();
        }
    };

    return (
        <div className={styles.codeShowcase}>
            <div className={styles.codeHeader}>
                <div className={styles.windowControls} aria-hidden="true">
                    <span className={clsx(styles.dot, styles.dotRed)} />
                    <span className={clsx(styles.dot, styles.dotYellow)} />
                    <span className={clsx(styles.dot, styles.dotGreen)} />
                </div>
                <div className={styles.tabList} role="tablist" aria-label="Code examples">
                    {codeSnippets.map((snippet) => (
                        <button
                            key={snippet.id}
                            id={`code-tab-${snippet.id}`}
                            role="tab"
                            aria-selected={activeTab === snippet.id}
                            aria-controls={`code-tabpanel-${snippet.id}`}
                            tabIndex={activeTab === snippet.id ? 0 : -1}
                            className={clsx(styles.tabButton, activeTab === snippet.id && styles.tabButtonActive)}
                            onClick={() => selectTab(snippet.id)}
                            onKeyDown={handleTabKeyDown}
                        >
                            {snippet.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className={styles.codeBody}>
                {codeSnippets.map((snippet) => (
                    <div
                        key={snippet.id}
                        id={`code-tabpanel-${snippet.id}`}
                        role="tabpanel"
                        aria-labelledby={`code-tab-${snippet.id}`}
                        aria-hidden={activeTab !== snippet.id}
                        className={clsx(styles.codePanel, activeTab === snippet.id && styles.codePanelActive)}
                    >
                        <CodeBlock language={snippet.language}>
                            {snippet.code}
                        </CodeBlock>
                    </div>
                ))}
            </div>
        </div>
    );
}

