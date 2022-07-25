.. _usage-content-overview:

Overview
========

Set Solace Cloud Token
----------------------

.. code-block:: bash

  export CLI_SOLACE_CLOUD_TOKEN={your token}


Api Importer
============

Help
----
.. code-block:: bash

  sep-async-api-importer -h


Importing a single Api
----------------------

.. code-block:: bash

  sep-async-api-importer -fp '{path to the api file}'

Importing Apis using a File Pattern
-----------------------------------

When using a file pattern, the importer will first create a list of api file names and then import one file after the other.

.. code-block:: bash

  sep-async-api-importer -fp '{glob pattern to api file(s)}'

.. note::

  Ensure you always encapsulate the `glob-pattern` in quotes, e.g. **'{my-root}/{dir}/\*\*/\*.spec.yml'**.


Example Patterns
++++++++++++++++

:-fp '{root}/{dir}/\*\*/\*.spec.yml': search for files in all sub-directories of `{root}/{dir}` that match pattern `\*.spec.yml`
:-fp '{root}/{dir}/\*\*/\*.yaml': search for files in all sub-directories of `{root}/{dir}` that match pattern `\*.yaml`


Importing Apis into one Application Domain
------------------------------------------

By default, the application domain is specified in the Api itself using the extension `x-sep-application-domain-name: {application-domain-name}`.
You can override the application domain name using the command line option: `-d {applicaton-domain-name}`.

.. code-block:: bash

  sep-async-api-importer -fp '{glob pattern to api file(s)}' -d {application-domain-name}


Pretty print the Output
-----------------------

The output is logged using `pino` logger, which comes with a pretty print utility: `pino-pretty`.

.. code-block:: bash

  sep-async-api-importer -fp '{glob pattern to api file(s)}' -d {application-domain-name} | npx pino-pretty

Redirect the Output to a log file
----------------------------------

Using standard shell commands, you can redirect the output to a log file.

.. code-block:: bash

  sep-async-api-importer -fp '{glob pattern to api file(s)}' -d {application-domain-name} | npx pino-pretty > {path}/logs/mylog.log 2>&1
