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

## Token

```bash
export CLI_SOLACE_CLOUD_TOKEN={token}
```

## Run (release_mode)

```bash
# single spec
npm run dev:start -- -fp ../data/passing/acme-retail/central-it/till-system/AcmeRetail-Central-IT-Provider-TillSystem-v1.spec.yml -d dev/test | npx pino-pretty

# glob
# note: don't forget the quotes around the glob pattern!
npm run dev:start -- -fp '../data/passing/**/*.spec.yml' | npx pino-pretty

npm run dev:start -- -fp '../data/passing/**/*.spec.yml' -d dev/test | npx pino-pretty


# redirect to log file

npm run dev:start -- -fp '../data/passing/**/*.spec.yml' | npx pino-pretty > ./devel/logs/log.log 2>&1


```

## Run (test_mode)


```bash

export CLI_MODE=test_mode

# single spec
npm run dev:start -- -fp ../data/passing/acme-retail/central-it/till-system/AcmeRetail-Central-IT-Provider-TillSystem-v1.spec.yml -d dev/test | npx pino-pretty

# glob
# note: don't forget the quotes around the glob pattern!
npm run dev:start -- -fp '../data/passing/**/*.spec.yml' | npx pino-pretty

npm run dev:start -- -fp '../data/passing/**/*.spec.yml' -d dev/test | npx pino-pretty


# redirect to log file

npm run dev:start -- -fp '../data/passing/**/*.spec.yml' | npx pino-pretty > ./devel/logs/log.log 2>&1


```

## Run Tests

```bash
export CLI_SOLACE_CLOUD_TOKEN={token}
npm test
```

### Run a Single Test
````bash
# set the env
source ./test/source.env.sh
# run test
# for example:
npx mocha --config test/.mocharc.yml test/specs/import-failing.spec.ts
# pretty print server output:
npx mocha --config test/.mocharc.yml test/specs/import-failing.spec.ts | npx pino-pretty
# unset the env
unset_source_env
````



---

The End.
