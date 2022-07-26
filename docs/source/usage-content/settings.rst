.. _usage-content-settings:

Settings
========

Solace Cloud Token
------------------

.. code-block:: bash

  export CLI_SOLACE_CLOUD_TOKEN={your token}


Environment
============

Environment variables can be set using a dotenv file (`.env`) and/or export environment variables.

Example dotenv file:
:download:`.env <../../../importer-cli/.env>`:


.. list-table:: Environment
   :widths: 25 25 50
   :header-rows: 1

   * - Environment Variable
     - Value(s)/Format
     - Description
   * - CLI_APP_ID
     - alpha-numeric
     - the importer app id. used for logging and creating temporary application domains in `test_mode`
   * - CLI_LOGGER_LOG_LEVEL
     - choices:[fatal, error, warn, info, debug, trace, silent], default=info
     - the log level
   * - CLI_MODE
     - choices: [release_mode, test_mode], default: release_mode
     - the mode. See :ref:`Cli mode details.<importer-content-overview>`
   * - CLI_ASSETS_TARGET_STATE
     - choices: [present], default: present
     - Ensures all assets defined in the api spec are `present` - applied in an idempotent manner.
   * - CLI_ASSET_IMPORT_TARGET_LIFECYLE_STATE
     - choices: [released], default: released
     - The target lifecycle state for imported assets.
   * - CLI_ASSET_IMPORT_TARGET_VERSION_STRATEGY
     - choices: [bump_minor, bump_patch], default: bump_patch
     - When a new version of an asset is created, which part of the semantic version should be bumped.
   * - CLI_EP_API_BASE_URL
     - default: 'https://api.solace.cloud'
     - Base Url for Solace Event Portal Rest Api.


.. * - CLI_ASSET_OUTPUT_DIR
..   - default: output
..   - output root dir (under ./tmp) for generated output, deleted & created at startup.

.. * - CLI_LOG_DIR
..   - default: logs
..   - log dir (under ./tmp), deleted & created at startup
