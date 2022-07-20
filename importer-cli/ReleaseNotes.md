# Release Notes

Solace Event Portal Async API Importer.

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
