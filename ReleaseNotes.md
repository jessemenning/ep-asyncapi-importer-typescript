# Release Notes

Solace Event Portal Async API Importer.

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
