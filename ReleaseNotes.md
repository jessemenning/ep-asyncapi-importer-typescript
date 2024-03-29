# Release Notes

Solace Event Portal Async API Importer.

## Version 0.5.4-alpha

**Enhancements:**
- improved logging of run context in log file
- improved logging of usage errors
- add a run summary to console output and log file

**Fixes:**
- added support for relative file references in api spec
- handle case of same message for different channels:
  - introduced a new extension: $.channels.{topic}.x-ep-event-name
  - event name = $.channels.{topic}.x-ep-event-name or if absent: $.channels.{topic}
  - event version name = $.channels.{topic}.x-ep-event-name or EMTPY


## Version 0.5.3-alpha

**New Features:**
- added support for creating an application based on the api as well

**Known Issues:**
- the created application version is missing the pub/sub events info.

## Version 0.5.2-alpha

Migrated repo to SolaceLabs.

## Version 0.5.1-alpha

**Fixes:**
- **Cli Option: -d, -domain**
  - fixed use of the global domain overriding domains in api files

## Version 0.5.0-alpha

Refactored.

## Version 0.4.1-alpha

**Core:**
- **Refactor with Ep Sdk 0.8.3-alpha**

## Version 0.4.0-alpha

**Core:**
- **Refactor with Ep AsyncAPI 0.2.x**

## Version 0.3.2-alpha

**Core:**
- **Refactor with Ep Sdk 0.5.x**

## Version 0.3.1-alpha

**Core:**
- **Refactor with Ep Sdk 0.3.x**
  - includes the ep-openapi-node package


## Version 0.3.0-alpha

**New Features:**
- **run tests before import for CLI_MODE=release_mode**
  - run tests in a dummy application domain before importing into target domain

**Enhancements:**
- **transaction ids**
  - added apiGroupTransactionId and apiTransactionId for transaction logging
  - maps to groupTransactionId and parentTransactionId in ep sdk tasks

**Core:**
- **Ep Sdk**
  - added use of EpSdkApplicationTask
  - added use of EpSdkEnumTask & EpSdkEnumVersionTask
  - added use of EpSdkSchemaTask & EPSdkSchemaVersionTask
  - added use of EpSdkEpEventTask & EPSdkEpEventVersionTask


## Version 0.2.0-alpha
  * [Solace Event Portal OpenAPI](https://github.com/solace-iot-team/sep-async-api-importer/blob/main/resources/sep-openapi-spec.2.0.0-ea.json): '2.0.0-ea'

**Core:**
- **switch to use package ep-sdk**

## Version 0.1.11-alpha
  * [Solace Event Portal OpenAPI](https://github.com/solace-iot-team/sep-async-api-importer/blob/main/resources/sep-openapi-spec.2.0.0-ea.json): '2.0.0-ea'

**Fixes:**
- **contentType**
  - checks message contentType, if it doesn't exist, checks api defaultContentType
  - if neither is found, aborts with error

**Documentation:**
- **Created Documentation**
  - https://solace-iot-team.github.io/sep-async-api-importer/index.html


## Version 0.1.10-alpha
  * [Solace Event Portal OpenAPI](https://github.com/solace-iot-team/sep-async-api-importer/blob/main/resources/sep-openapi-spec.2.0.0-ea.json): '2.0.0-ea'

**Enhancements:**
- **Run Context**
  - introduced a `runContext` for logging of issues - contains the context relevant to track down the issue faster
- **Importing of 2.0.0 specs**
  - support for spec version 2.0.0 added
- **Pre-Import Check**
  - Added more detailed output when grouped EventApiVersions define different Assets with the same name


## Version 0.1.9-alpha
  * [Solace Event Portal OpenAPI](https://github.com/solace-iot-team/sep-async-api-importer/blob/main/resources/sep-openapi-spec.2.0.0-ea.json): '2.0.0-ea'

**Fixes:**
- **CLI_MODE=test_mode**
  - fixed application domain deletion when importing multiple specs in test_mode

## Version 0.1.8-alpha
  * [Solace Event Portal OpenAPI](https://github.com/solace-iot-team/sep-async-api-importer/blob/main/resources/sep-openapi-spec.2.0.0-ea.json): '2.0.0-ea'

**Core:**
- **EP Api version upgrade**
  - upgraded to 2.0.0-ea


## Version 0.1.7-alpha
  * [Solace Event Portal OpenAPI](https://github.com/solace-iot-team/sep-async-api-importer/blob/main/resources/sep-openapi-spec.early-access.json): 'Early Access'

**New Features:**
- **new optional env var: CLI_MODE**
  - choices: ['release_mode', 'test_mode'], default: 'release_mode'
  - if `test_mode`:
    - the application domain name is prefixed with: `{appId}/{datetime}`
    - after importing, the application domain is deleted again

## Version 0.1.6-alpha
  * [Solace Event Portal OpenAPI](https://github.com/solace-iot-team/sep-async-api-importer/blob/main/resources/sep-openapi-spec.early-access.json): 'Early Access'

**Enhancements:**
- **configurable base url for EP Api**
  - new, optional env variable: CLI_EP_API_BASE_URL={ep-api-url}, default: 'https://api.solace.cloud'

## Version 0.1.5-alpha
  * [Solace Event Portal OpenAPI](https://github.com/solace-iot-team/sep-async-api-importer/blob/main/resources/sep-openapi-spec.early-access.json): 'Early Access'


**New Features:**

- **command line options**
  - removed '-f, --file'
  - replaced with: '-fp, --filePattern' - it now takes a single file or a glob pattern and operates on all files found by the pattern

**Fixes:**

- **Enums not created for subscribe operations**
  - they now are


## Version 0.1.4-alpha
  * [Solace Event Portal OpenAPI](https://github.com/solace-iot-team/sep-async-api-importer/blob/main/resources/sep-openapi-spec.early-access.json): 'Early Access'


**Initial Alpha Release.**


---
