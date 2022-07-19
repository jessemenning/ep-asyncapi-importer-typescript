# Development importer-cli


## Download Solace Event Portal Open API Spec

```bash
curl https://openapi-v2.solace.cloud/api-docs-v2.json --output ../resources/sep-openapi-spec.json
```

## Build

```bash
npm install
npm run dev:build
```

## Run

```bash
npm run dev:start -- -f ../data/acme-retail/central-it/till-system/AcmeRetail-Central-IT-Provider-TillSystem-v1.spec.yml | npx pino-pretty
```

---

The End.
