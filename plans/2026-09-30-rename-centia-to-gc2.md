# Navneskifte centia.io → gc2.io: implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Omdøb produktet Centia til GC2 (Geo Compute Cloud) i domæner, npm-pakker, repos, CLI, MCP, skills og tekst, uden at bryde eksisterende brugere.

**Architecture:** Rækkefølgen følger afhængighederne: infrastruktur først, så SDK'et som alt andet bygger på, derefter CLI, MCP-server og skills, så agent og app, så website, og til sidst cutover med redirects og deprecation. Hver pakke får et nyt navn under `@mapcentia` og en sidste `@centia-io`-version der re-eksporterer den nye.

**Tech Stack:** npm/pnpm, tsdown (SDK), oclif + mocha (CLI), tsc (MCP), Vite (app, danish-search), Docusaurus (website), Docker Swarm (agent), AWS ECS + ALB (API), Caddy.

**Spec:** `specs/2026-09-30-rename-centia-to-gc2-design.md`

## Global Constraints

- npm-scope er `@mapcentia`. Pakkenavne: `gc2-sdk`, `gc2-cli`, `gc2-mcp-server`, `danish-search`, `gc2-agent-protocol`, `gc2-agent-server`, `gc2-agent-ui`.
- Domæner: `gc2.io`, `api.gc2.io`. `api.centia.io` beholdes aktiv til fase 8.
- Firmaet hedder MapCentia; `mapcentia.com`, `mh@mapcentia.com` og `centia.com`-referencer røres ikke.
- Brandtekst: "GC2 (Geo Compute Cloud)" første gang på en side, derefter "GC2". "Centia" som produktnavn forsvinder.
- Søg-og-erstat matcher altid `centia.io`, `@centia-io`, `centia-io/` eller `mcp__centia__`, aldrig `centia` alene.
- CLI-binary `gc2`; `centia` beholdes som alias i én release med advarsel.
- OAuth clientId `gc2` med redirect `https://gc2.io/console/`; client `centia` beholdes til fase 8.
- Ingen funktionelle ændringer i nogen pakke.

## Review Focus

1. En bruger med `@centia-io/sdk@^0.2` installeret får 0.2.26 ved næste install og skal stadig kunne importere `PasswordFlow`, `Sql`, `CodeFlow`, `GuestFlow`, `Claims`, `Status` og subpath `./node`. Test i opgave 3.5.
2. En bruger der kører `centia login` efter opdatering skal få en advarsel og stadig logge ind, ikke "command not found". Test i opgave 4.3.
3. Et Claude Code-projekt med MCP-config `"args": ["-y", "@centia-io/mcp-server"]` skal stadig starte serveren og se tools med det gamle prefix, indtil brugeren skifter. Test i opgave 5.4.
4. En browserklient med refresh-token udstedt af client `centia` mod `api.centia.io` skal kunne forny efter fase 8's 301, fordi refresh-kaldet følger redirect. Test i opgave 8.2.
5. Docs-eksempler i `docs/**/*.mdx` må ikke indeholde `centia.io` eller `@centia-io` efter fase 7; en glemt URL sender brugere til et domæne der senere lukker. Test i opgave 7.4.

---

## Fase 1: Forudsætninger

### Opgave 1.1: DNS og certifikat for api.gc2.io, event.gc2.io og www.gc2.io

**Files:** ingen i repos; AWS Route 53, ACM og ALB for cluster `centia-io`.

- [ ] **Step 1:** Opret ACM-certifikat i eu-west-1 for `gc2.io`, `*.gc2.io`. Validér via DNS.
- [ ] **Step 2:** Opret Route 53-records: `api.gc2.io` som alias til den ALB der i dag betjener `api.centia.io`; `event.gc2.io` som alias til det der i dag betjener `event.centia.io` (WebSocket/realtime — docs, skills og admin-appens `VITE_GC2_WS_HOST` peger derhen); `www.gc2.io` og `gc2.io` til det der hoster websitet (samme mål som `centia.io`).
- [ ] **Step 3:** Tilføj certifikatet til ALB'ens HTTPS-listener, og tilføj listener-regler `Host: api.gc2.io` → samme target group som `api.centia.io` og `Host: event.gc2.io` → samme target group som `event.centia.io`.
- [ ] **Step 4: Verificér**

```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://api.gc2.io/api/v4/oauth
```
Expected: `4xx` (ikke connection error, ikke cert-fejl). `getent hosts api.gc2.io` og `getent hosts event.gc2.io` giver en IP; `curl -sS https://event.gc2.io/ping` svarer `pong`.

### Opgave 1.2: OAuth-client `gc2`

**Files:** ingen; API-kald mod api.centia.io som super-user.

- [ ] **Step 1:** Opret client.

```bash
curl -X POST https://api.centia.io/api/v4/clients -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"gc2","homepage":"https://gc2.io","description":"GC2 console","redirect_uri":["https://gc2.io/console/","http://localhost:4000/console/"],"public":true}'
```
Se `docs/clients.mdx` for feltnavne; ret hvis API'et svarer 400.

- [ ] **Step 2: Verificér** `GET /api/v4/clients` lister både `centia` og `gc2`.

### Opgave 1.3: Flyt GitHub-repos til org mapcentia

**Files:** ingen.

- [ ] **Step 1:** På GitHub: Settings → Transfer for `centia-io/website`, `centia-io/mcp-server`, `centia-io/centia-app` (omdøb til `gc2-app`), `centia-io/centia-docker` (omdøb til `gc2-docker`), `centia-io/danish-search` → org `mapcentia`.
- [ ] **Step 2:** Opdater lokale remotes.

```bash
for r in website mcp-server danish-search; do git -C ~/Source/$r remote set-url origin https://github.com/mapcentia/$r.git; done
git -C ~/Source/centia-app remote set-url origin https://github.com/mapcentia/gc2-app.git
git -C ~/Source/centia-docker remote set-url origin https://github.com/mapcentia/gc2-docker.git
```
- [ ] **Step 3: Verificér** `git -C ~/Source/website fetch` lykkes.

### Opgave 1.4: Ryd op i gc2-agent-arbejdstræet

**Files:** `~/Source/centia-agent/Dockerfile`, `~/Source/centia-agent/nginx/`

- [ ] **Step 1:** `git -C ~/Source/centia-agent diff Dockerfile` og læs ændringen. Hvis den hører til compose-opsætningen fra commit 118e8fc, commit den sammen med `nginx/`; ellers `git stash`.
- [ ] **Step 2:** `git -C ~/Source/centia-agent status --short` er tom.

---

## Fase 2: Backend

### Opgave 2.1: Bekræft at API'et svarer på api.gc2.io med korrekte absolutte URL'er

**Files:** `~/Source/geocloud2/app/conf/App.php`, `~/Source/geocloud2/docker/conf/gc2/App.php`

CORS er `*`, og Caddy lytter på `:80` uden hostname-binding, så API'et kræver ingen vhost-ændring. Det der skal tjekkes er absolutte URL'er i svar (OGC-links, `_links`, OAuth-discovery), som GC2 bygger fra `Host`-headeren.

- [ ] **Step 1: Verificér**

```bash
curl -s https://api.gc2.io/api/v4/ogc/database/mydb -H "Authorization: Bearer $TOKEN" | grep -o 'https://[a-z.]*' | sort -u
```
Expected: kun `https://api.gc2.io`. Hvis `api.centia.io` optræder, find stedet med `grep -rn "centia.io" app/` i geocloud2 og ret til at bruge `Host`.

- [ ] **Step 2:** Gennemgå `App.php` for hostname-afhængige nøgler (`host`, `vidiUrl`, `s3` `prefix` er `centia-io` og må gerne blive). Ingen ændring forventes.

### Opgave 2.2: Omdøb infrastruktur i centia-io-repoet

**Files:** `~/Source/centia-io/deploy.sh`, `deploy_ws.sh`, `deploy_cron.sh`, `conf/`

Kræver nye ECR-repos og ECS-services. Gøres som separat deploy, ikke sammen med noget andet.

- [ ] **Step 1:** Opret ECR-repo `gc2-io`, ECS-cluster `gc2-io` med services `gc2-http-service`, `gc2-event-service` som kopier af de eksisterende (samme task definitions, nye navne). Peg ALB-target groups til de nye services.
- [ ] **Step 2:** Ret scripts: `sed -i 's/centia-io/gc2-io/g; s/centia-http-service/gc2-http-service/g; s/centia-event-service/gc2-event-service/g' deploy.sh deploy_ws.sh deploy_cron.sh`.
- [ ] **Step 3:** Kør `./deploy.sh` og bekræft `curl https://api.gc2.io/api/v4/oauth` svarer.
- [ ] **Step 4:** Commit. Slet de gamle services først efter fase 8.

---

## Fase 3: SDK (`~/Source/gc2-js-client`)

### Opgave 3.1: Omdøb pakke og build-output

**Files:**
- Modify: `package.json`, `tsdown.config.ts`, `node.d.ts`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `examples/**`

**Interfaces:** Produces: npm-pakke `@mapcentia/gc2-sdk@0.3.0` med entry `dist/gc2-sdk.{js,cjs}` og subpath `./node` → `dist/gc2-sdk-node.{js,cjs}`; globalName `GC2SDK`.

- [ ] **Step 1: Skriv den fejlende test** i `src/__tests__/package.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import pkg from '../../package.json'
describe('package', () => {
  it('is published as @mapcentia/gc2-sdk with gc2-sdk entry files', () => {
    expect(pkg.name).toBe('@mapcentia/gc2-sdk')
    expect(pkg.main).toBe('./dist/gc2-sdk.cjs')
    expect(pkg.exports['./node'].import.default).toBe('./dist/gc2-sdk-node.js')
  })
})
```
- [ ] **Step 2:** `pnpm test -- package` → FAIL.
- [ ] **Step 3:** Ret `package.json`: `name` → `@mapcentia/gc2-sdk`, `version` → `0.3.0`, alle `centia-io-sdk` → `gc2-sdk` i `main`, `module`, `types`, `exports`. Tilføj `"repository": "github:mapcentia/gc2-js-client"`, `"homepage": "https://gc2.io/docs/sdk"`.
- [ ] **Step 4:** Ret `tsdown.config.ts`: entry-nøgler `gc2-sdk` og `gc2-sdk-node`, `globalName: "GC2SDK"`.
- [ ] **Step 5:** `sed -i 's/centia-io-sdk/gc2-sdk/g' node.d.ts` og ret `@centia-io/sdk` → `@mapcentia/gc2-sdk` i README, AGENTS.md, CLAUDE.md, examples.
- [ ] **Step 6:** `pnpm build && pnpm test` → PASS; `ls dist` viser kun `gc2-sdk*`.
- [ ] **Step 7:** Commit: `git commit -am "Rename package to @mapcentia/gc2-sdk"`.

### Opgave 3.2: Default-host api.gc2.io

**Files:** `src/**` (find med `grep -rn "api.centia.io" src`)

- [ ] **Step 1:** Skriv test i den eksisterende testfil for den klasse der har default-hosten (fx `src/http/__tests__/client.test.ts`):

```ts
it('defaults to https://api.gc2.io', () => {
  expect(DEFAULT_HOST).toBe('https://api.gc2.io')
})
```
Eksporter `DEFAULT_HOST` hvis den ikke er det.
- [ ] **Step 2:** Kør → FAIL.
- [ ] **Step 3:** `grep -rln "api.centia.io" src | xargs sed -i 's#api\.centia\.io#api.gc2.io#g'`.
- [ ] **Step 4:** `pnpm test` → PASS.
- [ ] **Step 5:** Commit.

### Opgave 3.3: Brandtekst i SDK-repoet

**Files:** `README.md`, `AGENTS.md`, `CLAUDE.md`, JSDoc i `src/**`

- [ ] **Step 1:** `grep -rn "Centia" README.md AGENTS.md CLAUDE.md src | grep -v "MapCentia\|mapcentia"` og ret hver forekomst manuelt til "GC2" (første gang pr. fil "GC2 (Geo Compute Cloud)").
- [ ] **Step 2:** Samme grep giver 0 hits. Commit.

### Opgave 3.4: Publish @mapcentia/gc2-sdk@0.3.0

- [ ] **Step 1:** `npm pack --dry-run` og bekræft filnavne `dist/gc2-sdk*`.
- [ ] **Step 2:** `npm publish --access public`.
- [ ] **Step 3:** `npm view @mapcentia/gc2-sdk version` → `0.3.0`. Tag: `git tag v0.3.0 && git push --tags`.

### Opgave 3.5: Shim-udgivelse af @centia-io/sdk@0.2.26

**Files:** Create: `~/Source/gc2-js-client/shims/centia-io-sdk/package.json`, `index.js`, `index.d.ts`, `node.js`, `node.d.ts`, `README.md`

- [ ] **Step 1:** Opret mappen med:

`package.json`
```json
{
  "name": "@centia-io/sdk",
  "version": "0.2.26",
  "description": "Deprecated: renamed to @mapcentia/gc2-sdk",
  "main": "./index.js",
  "types": "./index.d.ts",
  "exports": {
    ".": { "types": "./index.d.ts", "default": "./index.js" },
    "./node": { "types": "./node.d.ts", "default": "./node.js" },
    "./package.json": "./package.json"
  },
  "dependencies": { "@mapcentia/gc2-sdk": "0.3.0" },
  "license": "AGPL-3.0"
}
```
`index.js`: `export * from '@mapcentia/gc2-sdk'`. `index.d.ts`: samme linje. `node.js` og `node.d.ts`: `export * from '@mapcentia/gc2-sdk/node'`. README: "Renamed to @mapcentia/gc2-sdk. Install that instead."

- [ ] **Step 2: Test** i et tomt katalog:

```bash
cd $(mktemp -d) && npm init -y >/dev/null && npm i ~/Source/gc2-js-client/shims/centia-io-sdk && \
node -e "import('@centia-io/sdk').then(m=>{for (const k of ['PasswordFlow','Sql','CodeFlow','GuestFlow','Claims','Status']) if(!m[k]) throw k; console.log('ok')})" && \
node -e "import('@centia-io/sdk/node').then(()=>console.log('node ok'))"
```
Expected: `ok`, `node ok`.
- [ ] **Step 3:** `cd shims/centia-io-sdk && npm publish --access public`.
- [ ] **Step 4:** `npm deprecate @centia-io/sdk "Renamed to @mapcentia/gc2-sdk"` og `npm deprecate @mapcentia/gc2-js-client "Renamed to @mapcentia/gc2-sdk"`.
- [ ] **Step 5:** Commit shim-mappen.

---

## Fase 4: CLI (`~/Source/gc2-cli`)

### Opgave 4.1: Skift til @mapcentia/gc2-sdk og api.gc2.io

**Files:** `package.json`, `src/centiaClient.ts` → `src/gc2Client.ts`, `src/commands/login.ts`, `src/commands/privilege/set.ts`, `src/util/utils.ts:14`, `test/commands/whoami.test.ts`, `profiles/centia.json`, `profiles/gc2.json`

- [ ] **Step 1:** Ret testen `test/commands/whoami.test.ts`: `https://api.centia.io` → `https://api.gc2.io` (linje 27, 38, 46), import fra `@mapcentia/gc2-sdk` og `../gc2Client`.
- [ ] **Step 2:** `npm test -- --grep whoami` → FAIL.
- [ ] **Step 3:** `git mv src/centiaClient.ts src/gc2Client.ts`; `grep -rl "centiaClient" src test | xargs sed -i 's/centiaClient/gc2Client/g'`; `grep -rl "@centia-io/sdk" src test package.json profiles | xargs sed -i 's#@centia-io/sdk#@mapcentia/gc2-sdk#g'`; `sed -i "s#https://api.centia.io#https://api.gc2.io#" src/util/utils.ts`.
- [ ] **Step 4:** `npm i @mapcentia/gc2-sdk@^0.3.0 && npm rm @centia-io/sdk`.
- [ ] **Step 5:** `npm run build && npm test` → PASS. Commit.

### Opgave 4.2: Profiler og publish-navn

**Files:** `profiles/centia.json`, `profiles/gc2.json`, `scripts/prepack-guard.js`

`profiles/` styrer hvilket navn `prepack` publicerer under. Den nye sandhed er `gc2.json`.

- [ ] **Step 1:** Ret `profiles/gc2.json`: `"description": "GC2 (Geo Compute Cloud) CLI"`, dependency `@mapcentia/gc2-sdk`. Tilføj `"bin": {"gc2": "./bin/run", "centia": "./bin/run-centia"}`.
- [ ] **Step 2:** Opret `bin/run-centia` (kopi af `bin/run`) der før alt andet skriver til stderr: `The "centia" command is renamed to "gc2". This alias will be removed in a later release.` Gør den eksekverbar.
- [ ] **Step 3:** Slet `profiles/centia.json`. Læs `scripts/prepack-guard.js` og fjern referencen til centia-profilen.
- [ ] **Step 4:** `npm run prepack` uden fejl; `node bin/run-centia --version` skriver advarslen og versionen. Commit.

### Opgave 4.3: Brandtekst og publish

**Files:** `README.md`, `src/commands/**` (help-tekster)

- [ ] **Step 1:** `grep -rn "Centia\|centia.io" README.md src | grep -v mapcentia` og ret manuelt.
- [ ] **Step 2:** Bump version i `package.json` til dagens dato `2026.9.30`. `npm publish --access public`.
- [ ] **Step 3: Test** `npx -y @mapcentia/gc2-cli@latest --version` og `npx -y -p @mapcentia/gc2-cli centia --version` (advarsel + version).
- [ ] **Step 4:** `npm deprecate @centia-io/cli "Renamed to @mapcentia/gc2-cli (binary: gc2)"` og `npm deprecate @centia/cli "Renamed to @mapcentia/gc2-cli"`. Commit og tag.

---

## Fase 5: MCP-server og skills (`~/Source/mcp-server`, `~/Source/danish-search`)

### Opgave 5.1: danish-search

**Files:** `~/Source/danish-search/package.json`, `src/danish.js`, `README.md`, `skills/danish-search/SKILL.md`

- [ ] **Step 1:** `package.json`: name `@mapcentia/danish-search`, version `0.1.0`, dependency `@mapcentia/gc2-sdk: ^0.3.0`. `sed -i 's#@centia-io/danish-search#@mapcentia/danish-search#g; s#@centia-io/sdk#@mapcentia/gc2-sdk#g; s#api\.centia\.io#api.gc2.io#g' src/danish.js README.md skills/danish-search/SKILL.md`.
- [ ] **Step 2:** `pnpm i && pnpm build` → OK. `npm publish --access public`. `npm deprecate @centia-io/danish-search "Renamed to @mapcentia/danish-search"`. Commit.

### Opgave 5.2: MCP-server pakke, navn og host

**Files:** `package.json`, `src/index.ts:26,59`, `README.md`, `AGENTS.md`, `CLAUDE.md`

**Interfaces:** Produces: `@mapcentia/gc2-mcp-server`, server-navn `gc2-mcp-server`, bin `mcp-server` (uændret), tools navngivet som før så prefixet i klienter bliver `mcp__gc2__` (prefixet kommer fra klientens servernøgle, se 5.4).

- [ ] **Step 1:** `package.json`: name `@mapcentia/gc2-mcp-server`, version `1.1.0`, dependency `@mapcentia/gc2-sdk: ^0.3.0`, fjern `@centia-io/sdk`.
- [ ] **Step 2:** `src/index.ts`: linje 26 `DEFAULT_HOST = "https://api.gc2.io"`; linje 59 `name: "gc2-mcp-server"`; import fra `@mapcentia/gc2-sdk`; linje 434 "Not logged in to GC2."
- [ ] **Step 3:** `npm i && npm run build` → OK. Røgtest: `API_BASE_URL=https://api.gc2.io node dist/index.js` og send `{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"0"}}}` på stdin; svaret indeholder `"name":"gc2-mcp-server"`.
- [ ] **Step 4:** Commit.

### Opgave 5.3: Omdøb skills

**Files:** `skills/centia-*` → `skills/gc2-*`, `skills/README.md`, `AGENTS.md`, `src/index.ts` (readSkill-liste hvis navne er hardcodet)

- [ ] **Step 1:** `cd skills && for d in centia-*; do git mv $d gc2-${d#centia-}; done`.
- [ ] **Step 2:** `grep -rl "centia-" skills AGENTS.md src | xargs sed -i 's/centia-\(auth-model\|delivery\|feature\|file-import\|json-rpc\|keyvalue\|map-styling\|ogc\|openapi-docs\|ows\|privileges\|provisioning\|realtime\|runtime-sdk\|scheduler\|snapshots\|types-formats\)/gc2-\1/g'`.
- [ ] **Step 3:** `grep -rl "@centia-io\|centia\.io\|mcp__centia__" skills AGENTS.md README.md | xargs sed -i 's#@centia-io/sdk#@mapcentia/gc2-sdk#g; s#@centia-io/cli#@mapcentia/gc2-cli#g; s#@centia-io/mcp-server#@mapcentia/gc2-mcp-server#g; s#@centia-io/danish-search#@mapcentia/danish-search#g; s#api\.centia\.io#api.gc2.io#g; s#centia\.io#gc2.io#g; s#mcp__centia__#mcp__gc2__#g'`.
- [ ] **Step 4:** Brandtekst: `grep -rn "Centia" skills AGENTS.md README.md | grep -v "MapCentia\|mapcentia"` og ret manuelt (skill-frontmatter `description` skal sige "GC2 BaaS").
- [ ] **Step 5: Verificér** `grep -rn "centia" skills AGENTS.md src | grep -v "mapcentia\|centia-api.json"` er tom. Commit.

### Opgave 5.4: Publish og shim

- [ ] **Step 1:** `npm publish --access public` (`@mapcentia/gc2-mcp-server@1.1.0`).
- [ ] **Step 2:** Opret `shims/centia-io-mcp-server/package.json` med name `@centia-io/mcp-server`, version `1.0.34`, `"bin": {"mcp-server": "./run.js"}`, dependency `@mapcentia/gc2-mcp-server: 1.1.0`, og `run.js`:

```js
#!/usr/bin/env node
import { createRequire } from 'node:module'
process.stderr.write('@centia-io/mcp-server is renamed to @mapcentia/gc2-mcp-server\n')
await import(createRequire(import.meta.url).resolve('@mapcentia/gc2-mcp-server/dist/index.js'))
```
- [ ] **Step 3: Test** `npx -y @centia-io/mcp-server@1.0.34` starter og svarer på `initialize` (som i 5.2 step 3). Med servernøglen `centia-io` i en Claude Code-config hedder tools stadig `mcp__centia-io__*`, fordi prefixet er klientens nøgle; det er den forventede bagudkompatibilitet.
- [ ] **Step 4:** Publish shim, `npm deprecate @centia-io/mcp-server "Renamed to @mapcentia/gc2-mcp-server"`, `npm deprecate @centia/mcp-server "Renamed to @mapcentia/gc2-mcp-server"`. Commit.

### Opgave 5.5: Synkronisér lokale skills

**Files:** `~/.claude/skills/*` (symlinks til `~/Source/mcp-server/skills/*`)

- [ ] **Step 1:** `cd ~/.claude/skills && for l in centia-*; do [ -L $l ] && rm $l; done; for d in ~/Source/mcp-server/skills/gc2-*; do ln -sfn $d $(basename $d); done`.
- [ ] **Step 2:** `ls -l ~/.claude/skills | grep -c gc2-` → 17. Ingen `centia-*` tilbage.

---

## Fase 6: Agent (`~/Source/centia-agent`) og app (`~/Source/centia-app`)

### Opgave 6.1: Protocol-pakke

**Files:** `packages/protocol/package.json`

- [ ] **Step 1:** name `@mapcentia/gc2-agent-protocol`, version `0.2.0`. `pnpm --filter @mapcentia/gc2-agent-protocol build`.
- [ ] **Step 2:** `npm publish --access public` fra `packages/protocol`. Commit.

### Opgave 6.2: Server og UI

**Files:** `packages/server/package.json`, `packages/ui/package.json`, `packages/server/src/{index,prompt,mcpPool,auth,chat}.ts`, `packages/server/test/chat.test.ts`, `packages/ui/src/{AgentChat.tsx,stream.ts,types.ts,index.ts}`, `package.json` (rod), `pnpm-workspace.yaml`

- [ ] **Step 1:** Ret `packages/server/test/chat.test.ts` så forventet systemprompt-tekst matcher "GC2 (Geo Compute Cloud)" og skill-navnet `gc2-map-styling`. `pnpm --filter ./packages/server test` → FAIL.
- [ ] **Step 2:** `grep -rl "@centia-io/agent-protocol" packages | xargs sed -i 's#@centia-io/agent-protocol#@mapcentia/gc2-agent-protocol#g'`. package.json-navne: `@mapcentia/gc2-agent-server`, `@mapcentia/gc2-agent-ui`, version `0.2.0`, dependency `@mapcentia/gc2-agent-protocol: ^0.2.0`. Rod-`package.json` name `gc2-agent`.
- [ ] **Step 3:** `mcpPool.ts:41` og `auth.ts:6`: `https://api.gc2.io`. `mcpPool.ts:45`: `name: "gc2-agent"`. `index.ts:117`: `gc2-agent server`.
- [ ] **Step 4:** `prompt.ts`: linje 3 → `You are an AI assistant embedded in a GC2 (Geo Compute Cloud, by MapCentia) admin application. You help the user inspect, provision, and style a PostgreSQL/PostGIS-based Backend-as-a-Service database through GC2 MCP tools.`; linje 15 `gc2-map-styling`; linje 51 `# GC2 core rules (AGENTS.md)`; linje 59 `Detailed GC2 guides`.
- [ ] **Step 5:** `pnpm i && pnpm -r build && pnpm -r test` → PASS. Publish server og ui. Commit.

### Opgave 6.3: Docker og deploy

**Files:** `Dockerfile:32-33,51,61`, `docker-compose.yml:6,41,79-80`, `.env.example:2,24`, `README.md`

- [ ] **Step 1:** Dockerfile: filter-navne `@mapcentia/gc2-agent-protocol` / `-server`; `npm install -g @mapcentia/gc2-mcp-server@${MCP_SERVER_VERSION}`; `MCP_ARGS=/usr/local/lib/node_modules/@mapcentia/gc2-mcp-server/dist/index.js`. Sæt `MCP_SERVER_VERSION` default til `1.1.0`.
- [ ] **Step 2:** docker-compose.yml og .env.example: `centia-agent` → `gc2-agent` (stack og traefik-backend), `API_BASE_URL` default `https://api.gc2.io`, `MCP_ARGS`-sti som ovenfor.
- [ ] **Step 3:** `docker build -t mapcentia/gc2-agent:latest .` → OK. `docker run --rm mapcentia/gc2-agent:latest ls /usr/local/lib/node_modules/@mapcentia/gc2-mcp-server/dist/index.js` → findes.
- [ ] **Step 4:** Deploy: `docker stack rm centia-agent && docker stack deploy -c <(docker compose config) gc2-agent`. Røgtest chat-endpointet med et gyldigt token.
- [ ] **Step 5:** Commit. `mv ~/Source/centia-agent ~/Source/gc2-agent`.

### Opgave 6.4: Admin-app

**Files:** `~/Source/centia-app/package.json`, `index.html:6`, `src/baas/client.ts:1`, `src/layout/AppLayout.tsx:14-15`, `src/auth/LoginPage.tsx:31`, `.env*`, `CLAUDE.md`

- [ ] **Step 1:** `package.json`: name `gc2-web`; dependencies `@mapcentia/gc2-agent-protocol ^0.2.0`, `@mapcentia/gc2-agent-ui ^0.2.0`, `@mapcentia/gc2-sdk ^0.3.0`; fjern de tre `@centia-io`.
- [ ] **Step 2:** `grep -rl "@centia-io/" src | xargs sed -i 's#@centia-io/agent-protocol#@mapcentia/gc2-agent-protocol#g; s#@centia-io/agent-ui#@mapcentia/gc2-agent-ui#g; s#@centia-io/sdk#@mapcentia/gc2-sdk#g'`.
- [ ] **Step 3:** Logo-URL'er → `https://gc2.io/img/gc2-logo.svg` / `gc2-logo-dark.svg` (filerne laves i 7.1); alt `Centia.io`/`Centia Admin` → `GC2 Admin`. Env-navne `VITE_CENTIA_*` → `VITE_GC2_*` i `.env*` og `src/baas/client.ts`; produktions-`.env` sætter `VITE_GC2_HOST=https://api.gc2.io`, `VITE_GC2_CLIENT_ID=gc2`.
- [ ] **Step 4:** `pnpm i && pnpm build` → OK. `grep -rn "centia" src index.html | grep -v mapcentia` tom. Commit, deploy til `https://gc2.io/console/`.

---

## Fase 7: Website (`~/Source/website`)

### Opgave 7.1: Konfiguration, logo og komponenter

**Files:** `docusaurus.config.js:27-32,41-42,93,104,137-148,160,183,192,205`, `static/robots.txt:6-7`, `static/img/gc2-logo.svg`, `static/img/gc2-logo-dark.svg`, `src/components/loginButton.js:1,12-14,19,67`, `src/components/creds.js:1`, `src/hooks/auth.js:2`, `src/components/HomepageCode/index.js:12,16,38-43,77,84,95`, `src/pages/index.js`, `src/pages/faq.mdx`, `package.json`

- [ ] **Step 1:** Tilføj logofiler (`cp static/img/centia-logo.svg static/img/gc2-logo.svg` som placeholder hvis det endelige logo ikke er klar; notér det i commit-beskeden). Slet ikke de gamle før fase 8 (centia-app linker til dem indtil 6.4 er deployet).
- [ ] **Step 2:** `docusaurus.config.js`: `title: 'GC2'`, `tagline: 'Geo Compute Cloud — managed PostGIS in the cloud or self-hosted with Docker'`, `url: 'https://gc2.io'`, `organizationName: 'mapcentia'`, `projectName: 'website'`, editUrl'er → `https://github.com/mapcentia/website/tree/main/`, meta-description "GC2 (Geo Compute Cloud) is a geospatial BaaS …", `og:site_name: 'GC2'`, navbar title `GC2`, logo `img/gc2-logo*.svg`, alt `GC2 logo`, swagger → `https://api.gc2.io/swagger-ui/index.html`, stackoverflow-tag `gc2`, GitHub → `https://github.com/mapcentia/`, copyright `MapCentia`.
- [ ] **Step 3:** `static/robots.txt`: `https://gc2.io/sitemap.xml`, `Host: gc2.io`.
- [ ] **Step 4:** `loginButton.js`: `host: 'https://api.gc2.io'`, `clientId: 'gc2'`, `redirectUri: 'https://gc2.io/console/'`, signup-link `https://api.gc2.io/signup?redirect_uri=https://gc2.io/console?r`.
- [ ] **Step 5:** `pnpm rm @centia-io/sdk && pnpm add @mapcentia/gc2-sdk@^0.3.0`; `sed -i 's#@centia-io/sdk#@mapcentia/gc2-sdk#' src/components/creds.js src/components/loginButton.js src/hooks/auth.js src/components/HomepageCode/index.js`.
- [ ] **Step 6:** `HomepageCode/index.js`: `api.centia.io` → `api.gc2.io`; MCP-config-nøgle `"centia-io"` → `"gc2"`, pakke `@mapcentia/gc2-mcp-server`; clone-URL `https://github.com/mapcentia/gc2-docker.git`. `src/pages/index.js` og `faq.mdx`: brandtekst manuelt.
- [ ] **Step 7:** `pnpm build` → OK. Commit: "Rebrand site config and components to GC2".

### Opgave 7.2: Mekaniske erstatninger i docs

**Files:** `docs/**/*.mdx` (36 filer)

- [ ] **Step 1:**

```bash
cd ~/Source/website && grep -rl "centia" docs | xargs sed -i \
  -e 's#https://api\.centia\.io#https://api.gc2.io#g' \
  -e 's#api\.centia\.io#api.gc2.io#g' \
  -e 's#@centia-io/sdk#@mapcentia/gc2-sdk#g' \
  -e 's#@centia-io/cli#@mapcentia/gc2-cli#g' \
  -e 's#@centia-io/mcp-server#@mapcentia/gc2-mcp-server#g' \
  -e 's#@centia-io/danish-search#@mapcentia/danish-search#g' \
  -e 's#github\.com/centia-io/centia-docker#github.com/mapcentia/gc2-docker#g' \
  -e 's#github\.com/centia-io/#github.com/mapcentia/#g' \
  -e 's#https://centia\.io/#https://gc2.io/#g' \
  -e 's#mcp__centia__#mcp__gc2__#g' \
  -e 's#"centia-io": {#"gc2": {#g'
```
- [ ] **Step 2:** CLI-eksempler (16 filer): `grep -rl '`centia \|^centia ' docs | xargs sed -i -E 's/(^|`|\$ )centia (import|sql|login|logout|whoami|connect|schema|table|column|user|client|privilege|rule|index|constraint|config)/\1gc2 \2/g'`.
- [ ] **Step 3: Verificér** `grep -rn "centia\.io\|@centia-io\|centia-io/\|mcp__centia\|centia [a-z]" docs` er tom. `pnpm build` → OK. Commit: "Replace centia.io URLs and package names in docs".

### Opgave 7.3: Brandtekst i docs

**Files:** `docs/intro.mdx`, `docs/start.mdx`, `docs/opensource.mdx`, `docs/sdk.mdx`, `docs/agentic-development.mdx`, `docs/clients.mdx` og resten med `grep -rln "Centia" docs`

- [ ] **Step 1:** `grep -rn "Centia" docs | grep -v "MapCentia\|mapcentia"` og ret hver linje manuelt. Regler: første forekomst pr. side "GC2 (Geo Compute Cloud)", derefter "GC2"; "Centia.io" → "GC2"; "Centia Cloud" → "GC2 Cloud"; "the Centia Web App" → "the GC2 Web App"; sætninger der beskriver produktet læses igennem, ikke bare erstattes.
- [ ] **Step 2:** `docs/opensource.mdx`: "Centia.io is licensed under AGPLv3 and is derived from the Geocloud2 project" → "GC2 (Geo Compute Cloud) is licensed under AGPLv3. Its core is the open source Geocloud2 project, …" plus repo-link `mapcentia/gc2-docker`.
- [ ] **Step 3:** Samme grep giver 0 hits. `pnpm build` → OK. Commit: "Rebrand docs text to GC2".

### Opgave 7.4: Verifikation og deploy

- [ ] **Step 1: Test** (hele repoet, ekskl. specs/plans/node_modules/build):

```bash
cd ~/Source/website && grep -rn "centia" --exclude-dir=node_modules --exclude-dir=build --exclude-dir=.git --exclude-dir=specs --exclude-dir=plans . | grep -v "mapcentia\|static/img/centia-logo"
```
Expected: tom.
- [ ] **Step 2:** `pnpm build && pnpm serve` og klik igennem: forside, intro, sdk, start (login-knap mod api.gc2.io med client `gc2`), snapshots.
- [ ] **Step 3:** Deploy til gc2.io (samme pipeline som centia.io; ret deploy-målet i `package.json`/CI hvis det er hardcodet). `curl -sI https://gc2.io/docs/intro | head -1` → 200.
- [ ] **Step 4:** Commit og push.

---

## Fase 8: Cutover og oprydning

### Opgave 8.1: 301 fra centia.io; api.centia.io forwardes uændret

**Files:** `static/_redirects` (Netlify); ingen ALB-ændring.

ALB redirect-actions kan kun 301/302. Begge får `fetch` til at gentage et POST som GET uden body, så token-exchange og refresh fra klienter med `host: api.centia.io` ville fejle. Derfor redirectes API'et ikke: ALB'en forwarder `api.centia.io` og `event.centia.io` til samme target groups som de nye hosts i hele overgangsperioden, og reglerne fjernes først i 8.3.

- [x] **Step 1:** `static/_redirects` i website-repoet: `https://centia.io/* https://gc2.io/:splat 301!` og samme for `www.centia.io` (begge domæner er aliaser på samme Netlify-site, derfor host-scoped). Committet som 1ca7484.
- [ ] **Step 2: Test** `curl -sI https://centia.io/docs/intro | grep -i "^HTTP\|^location"` → `301`, `location: https://gc2.io/docs/intro`. Og `curl -sS -o /dev/null -w "%{http_code}" https://api.centia.io/api/v4/oauth` → `406` (ingen redirect).

### Opgave 8.2: Bekræft at gamle klienter stadig virker mod api.centia.io

- [ ] **Step 1:** Med `@centia-io/sdk@0.2.27` (ikke shimmen) og `host: https://api.centia.io`: log ind med client `centia` og kald refresh. Expected: begge lykkes, og svarets `_links`/OGC-links peger på `api.centia.io`.
- [ ] **Step 2:** Notér resultatet i spec'ens risikoafsnit.

### Opgave 8.3: Deprecate resten og ryd op

- [ ] **Step 1:** `for p in agent-ui agent-protocol agent-server; do npm deprecate @centia-io/$p "Renamed to @mapcentia/gc2-$p"; done`.
- [ ] **Step 2:** Efter overgangsperioden (forslag: 3 måneder): slet OAuth-client `centia` (`DELETE /api/v4/clients/centia`), fjern `bin/run-centia` og `centia`-bin fra gc2-cli-profilen, fjern ALB-reglerne for `api.centia.io` og `event.centia.io` (ingen redirect; gamle klienter skal være migreret), slet `static/img/centia-logo*.svg`, slet ECS-services `centia-http-service`/`centia-event-service`.
- [ ] **Step 3:** Opdater `specs/2026-09-30-rename-centia-to-gc2-design.md` status til "gennemført".
