# Navneskifte fra centia.io til gc2.io

Dato: 2026-09-30
Status: godkendt design, klar til implementeringsplan

## Mål

Produktet Centia omdøbes til GC2, der står for **Geo Compute Cloud**. Det omfatter domæner, npm-pakker, GitHub-repos,
CLI-binary, OAuth-client, MCP-toolprefix, Claude-skills og brandtekst i docs og UI.
Firmaet hedder fortsat MapCentia, og npm-scope'et er `@mapcentia`.

Eksisterende brugere må ikke brydes: centia.io redirecter til gc2.io, og api.centia.io
forwardes uændret (ALB kan kun 301/302, som ødelægger POST) i en overgangsperiode, og de gamle `@centia-io`-pakker får en sidste version der
re-eksporterer den nye pakke og markeres deprecated.

## Ikke-mål

- `mapcentia.com` og alle `centia.com`-referencer (vidi, geocloud2) røres ikke.
- Vidi omdøbes ikke.
- Ingen funktionelle ændringer i nogen pakke; kun navne, hosts og tekst.

## Kortlægning (30. september 2026)

| Element | I dag | Nyt |
|---|---|---|
| Web og docs | centia.io | gc2.io |
| API | api.centia.io | api.gc2.io |
| Realtime (WebSocket) | event.centia.io | event.gc2.io |
| SDK | `@centia-io/sdk` 0.2.25 (repo gc2-js-client; ældre linje `@mapcentia/gc2-js-client` 0.0.25) | `@mapcentia/gc2-sdk` |
| CLI | `@centia-io/cli` 2026.6.1, bin `centia` | `@mapcentia/gc2-cli` (findes allerede på npm, samme version), bin `gc2` |
| MCP-server | `@centia-io/mcp-server` 1.0.33, toolprefix `mcp__centia__` | `@mapcentia/gc2-mcp-server`, prefix `mcp__gc2__` |
| Dansk søgning | `@centia-io/danish-search` 0.0.2 | `@mapcentia/danish-search` |
| Agent | `@centia-io/agent-protocol`, `agent-server`, `agent-ui` 0.1.0 (repo github.com/mapcentia/gc2-agent, lokalt `~/Source/centia-agent`) | `@mapcentia/gc2-agent-protocol`, `gc2-agent-server`, `gc2-agent-ui` |
| Gamle pakker | `@centia/cli` 2025.9.3, `@centia/mcp-server` 1.0.1 | deprecates |
| GitHub-org | centia-io (website, mcp-server, centia-app, centia-docker, danish-search) | mapcentia |
| OAuth-client | `clientId: centia`, redirect `https://centia.io/console/` | `clientId: gc2`, redirect `https://gc2.io/console/` |
| Claude-skills | 14 skills `centia-*` i mcp-server-repoet og `~/.claude/skills` | `gc2-*` |
| Docker-stack (agent) | stack og traefik-backend `centia-agent`; images hedder allerede `mapcentia/gc2-agent` | `gc2-agent` |
| Infra | repo centia-io: services `centia-http-service`, `centia-mapserver-service`, cache-endpoint `centia-io-*` | `gc2-*` |

Fakta bag tabellen:

- `@mapcentia` findes på npm med `gc2-cli` og `gc2-js-client`. `@gc2-io` og `@gc2` er ledige, men bruges ikke.
- gc2.io har A-record. `api.gc2.io` og `www.gc2.io` findes ikke i DNS.
- gc2-agent har remote på github.com/mapcentia/gc2-agent og master er pushet.
  Arbejdstræet har en ucommittet ændring i `Dockerfile` og en utracket mappe `nginx/`.
- Website-repoet har 36 docs-sider, `docusaurus.config.js`, `robots.txt` og
  login-komponenter med centia.io-referencer.

## Afhængigheder og rækkefølge

Alt bygger på SDK'et, og docs må først skifte når api.gc2.io svarer. Derfor:

```
1 forudsætninger → 2 backend → 3 SDK → 4 CLI → 5 MCP + skills → 6 agent + app → 7 website → 8 cutover
```

Fase 4, 5 og 6 kan køre parallelt efter fase 3, bortset fra at fase 6 kræver fase 5
(agentens Dockerfile og systemprompt refererer MCP-pakken og skill-navne).

## Faser

### 1. Forudsætninger (ingen kodeændringer)

- DNS: `api.gc2.io`, `event.gc2.io` og `www.gc2.io`. Certifikater for alle tre.
- OAuth: opret client `gc2` med redirect `https://gc2.io/console/` i geocloud2 ved siden
  af den eksisterende `centia`-client. Begge lever til fase 8.
- GitHub: flyt website, mcp-server, centia-app, centia-docker og danish-search fra
  org centia-io til mapcentia. GitHub redirecter gamle URL'er.
- gc2-agent: commit eller ryd op i `Dockerfile` og `nginx/` før fasen starter.

### 2. Backend (geocloud2 og centia-io-infra)

- Tilføj `api.gc2.io` som ekstra hostname i Apache-vhost og som CORS-origin.
  `api.centia.io` beholdes aktivt til fase 8.
- Omdøb services og cache-endpoint i centia-io-repoet i et separat trin, fordi det
  kræver redeploy.

### 3. SDK (gc2-js-client)

- package.json: navn `@mapcentia/gc2-sdk`, version 0.3.0.
- Default-host `https://api.gc2.io`. Byggede filnavne `gc2-sdk*.js` i stedet for
  `centia-io-sdk*.js` (19 forekomster i repoet plus node-varianterne).
- Publish 0.3.0.
- Publish `@centia-io/sdk` 0.2.26 som ren re-eksport af `@mapcentia/gc2-sdk` og kør
  `npm deprecate` med henvisning til det nye navn. Samme for `@mapcentia/gc2-js-client`.

### 4. CLI (gc2-cli)

- Repoet hedder allerede `@mapcentia/gc2-cli` med bin `gc2`; kun publish-navnet
  `@centia-io/cli` er ude af trit.
- Skift dependency til `@mapcentia/gc2-sdk`, default-host og tekst (8 `centia.io`,
  52 `centiaClient`-identifikatorer, én fil `centiaClient.ts`).
- Behold `centia` som ekstra bin i én release med en advarsel.
- Deprecate `@centia-io/cli` og `@centia/cli` med henvisning til `@mapcentia/gc2-cli`.

### 5. MCP-server og skills

- package.json: `@mapcentia/gc2-mcp-server`. Server-navn og toolprefix `gc2`.
- Skills i repoet omdøbes fra `centia-*` til `gc2-*` og opdateres: pakkenavne,
  toolnavne (`mcp__centia__*` → `mcp__gc2__*`), hosts og brandtekst.
  `danish-search`-skillen beholder sit navn men opdaterer pakkenavnet.
- Reference til `@centia-io/danish-search` skiftes til `@mapcentia/danish-search`
  (danish-search-repoet omdøbes i samme fase; det er lille).
- `~/.claude/skills` synkroniseres fra repoet.
- Deprecate `@centia-io/mcp-server` og `@centia/mcp-server`.

### 6. Agent (gc2-agent) og centia-app

Rækkefølge inden i fasen, fordi pakkerne afhænger af hinanden:

1. Omdøb `protocol` til `@mapcentia/gc2-agent-protocol` og publish. Server og UI
   importerer typer derfra i seks filer.
2. Omdøb `server` og `ui`, opdater deres dependency på protocol, publish.
3. Dockerfile: installer `@mapcentia/gc2-mcp-server` og ret `MCP_ARGS`-stien.
4. Default `API_BASE_URL` til `https://api.gc2.io` i `mcpPool.ts`, `auth.ts`,
   `.env.example` og `docker-compose.yml`. MCP-klientnavn `gc2-agent`.
5. Systemprompt (`prompt.ts`) og `chat.test.ts`: brandtekst læses igennem manuelt.
   "Centia" som produkt bliver "GC2 (Geo Compute Cloud)"; "MapCentia" som firma bevares. Skill-navnet
   `centia-map-styling` følger fase 5.
6. Workspace-navn, Docker-stack og traefik-backend til `gc2-agent`. Det er et nyt
   stack-navn, så den gamle stack fjernes eksplicit ved redeploy.
7. centia-app: de tre agent-dependencies, SDK, logo, `api.gc2.io` og clientId `gc2`.
8. Lokal mappe `~/Source/centia-agent` omdøbes til `gc2-agent` (kosmetisk).

### 7. Website (dette repo)

- `docusaurus.config.js`: `url`, `organizationName`, `projectName`, `editUrl`,
  swagger-link, GitHub-link, logo-filer.
- `static/robots.txt`: sitemap og host.
- `src/components/loginButton.js`: host, clientId, redirectUri, signup-link.
- `src/components/creds.js`, `src/hooks/auth.js`: SDK-import.
- Alle 36 docs-sider og `src/pages/faq.mdx`: `api.centia.io` → `api.gc2.io`,
  `@centia-io/sdk` → `@mapcentia/gc2-sdk`, `@centia-io/cli` → `@mapcentia/gc2-cli`,
  `@centia-io/mcp-server` → `@mapcentia/gc2-mcp-server`, CLI-eksempler `centia …` → `gc2 …`.
  Brandtekst ("Centia.io is a Backend as a Service") læses igennem manuelt. Navnet
  udfoldes som "GC2 (Geo Compute Cloud)" første gang på intro-siden, forsiden og i
  `docusaurus.config.js` (title og tagline); derefter bare "GC2".
- Logo-filer `centia-logo*.svg` erstattes.
- Deploy til gc2.io.

### 8. Cutover og oprydning

- 301 fra centia.io og api.centia.io til gc2.io.
- `npm deprecate` på hele `@centia-io`-scopet og på `@centia/*`.
- Efter overgangsperioden: fjern OAuth-client `centia`, bin-aliaset `centia` i CLI'en
  og hostname `api.centia.io` i vhost.

## Risici

- OAuth-redirect-URI'er matcher eksakt. Redirecten i fase 8 dækker API-kald, men
  eksisterende klienters redirect-URI'er peger på centia.io, så begge clients og
  begge domæner skal være registreret til klienterne er opdateret.
- Søg-og-erstat skal matche `centia.io`, `@centia-io` og `centia-io/`, ikke `centia`
  alene: vidi og geocloud2 har flere hundrede `centia.com`-referencer der skal blive.
- Skills og systemprompt læses af en model. Forkert brandtekst der giver ingen
  byggefejl, så de skal gennemlæses, ikke kun greppes.
- `@mapcentia/gc2-sdk` er et nyt navn. Alternativet `@mapcentia/gc2-js-client` findes
  allerede, men afviger fra "sdk"-sproget i alle docs og skills. Valget er `gc2-sdk`.

## Test og verifikation

- Per pakke: build og eksisterende tests grønne under nyt navn; `npm pack` og
  inspicer filnavne før publish.
- Efter fase 3: `npm install @centia-io/sdk@0.2.26` i et tomt projekt og bekræft at
  den re-eksporterer det nye SDK.
- Efter fase 6: agent-stacken svarer på gc2-agent-URL'en og kan kalde MCP-tools.
- Efter fase 7: `pnpm build` uden fejl; `grep -r "centia.io\|@centia-io" docs src static`
  giver nul hits; login-flowet mod api.gc2.io med client `gc2` virker.
- Efter fase 8: `curl -I https://api.centia.io/api/v4/…` giver 301 til gc2.io.
