# Solace Event Portal Async API Importer

[![integration-test](https://github.com/solace-iot-team/sep-async-api-importer/actions/workflows/integration-test.yml/badge.svg)](https://github.com/solace-iot-team/sep-async-api-importer/actions/workflows/integration-test.yml)

[Issues & Feature Requests](https://github.com/solace-iot-team/sep-async-api-importer/issues) |
[Release Notes](./ReleaseNotes.md) |

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

### Importing Async API Specs

You can import a single file or specify a file pattern - all found files are imported one by one.

````bash
# help
sep-async-api-importer -h

# standard output
sep-async-api-importer -fp {full path to async api spec file or a glob pattern} -d {event portal application domain}

# pretty output
sep-async-api-importer -fp {full path to async api spec file or a glob pattern} -d {event portal application domain} | npx pino-pretty
````



## Environment Options

[See .env file](https://github.com/solace-iot-team/sep-async-api-importer/blob/main/importer-cli/.env)

---
