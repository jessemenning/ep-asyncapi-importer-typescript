# Solace Event Portal Async API Importer

[![integration-test](https://github.com/solace-iot-team/sep-async-api-importer/actions/workflows/integration-test.yml/badge.svg)](https://github.com/solace-iot-team/sep-async-api-importer/actions/workflows/integration-test.yml)


> :warning: UNDER CONSTRUCTION

Import Async Api Specs into Solace Event Portal.


## Prerequisites

* node 16

## Install Globally

````bash
npm install @solace-iot-team/sep-async-api-importer -g
````


## Usage

### Set Solace Cloud Token
````bash
export CLI_SOLACE_CLOUD_TOKEN={your token}
````

### Import 1 Async API Spec

````bash
# help
sep-async-api-importer -h

# standard output
sep-async-api-importer -f {full path to async api spec} -d {event portal application domain}

# pretty output
sep-async-api-importer -f {full path to async api spec} -d {event portal application domain} | npx pino-pretty
````

## Environment Options

[See .env file](https://github.com/solace-iot-team/sep-async-api-importer/blob/main/importer-cli/.env)

---
