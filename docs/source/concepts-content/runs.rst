.. _importer-content-runs:

Importer Modes
==============


Test Mode
---------

.. code-block:: bash

  export CLI_MODE="test_mode"

Testing consists of two passes:

Test Pass 1:
++++++++++++

Import all Apis into their respective application domains prefixed with `{appName}/test/{runId}`, where:

- {appName}: the importer name, defined by the env var: `CLI_APP_NAME`
- {runId}: auto generated run id from timestamp in format: `YYYY-MM-DD-HH-MM-SS-mmm`

Test Pass 2:
++++++++++++

Import all Apis again in `checkmode`.

Checkmode tests if anything would change but doesn't actually change anything.

This second pass detects asset definition inconsistencies within Api files and across Api files.


Release Mode
------------

.. code-block:: bash

  export CLI_MODE="release_mode"


Performs a run in Test Mode first, then imports each Api into their respective application domains.
