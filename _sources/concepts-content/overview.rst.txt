.. _importer-content-overview:

Overview
========


* **test & validate** importing Apis in CI/CD pipeline
* **import** ready Apis in CI/CD pipeline into released or draft state

Validation Strategy
-------------------

Parsing of Api Files
++++++++++++++++++++

Apis are parsed & validated using `@asyncapi/parser <https://github.com/asyncapi/parser-js>`_.

Application Domain Unique Asset Definitions
+++++++++++++++++++++++++++++++++++++++++++

The importer validates the use of unique asset names, versions and content within the target application domain.

It can detect inconsistent definitions of:

- channels (topics)
- channel parameters (enums)
- channel message schemas (content)

Globally Unique Asset Definitions
+++++++++++++++++++++++++++++++++

In order to detect inconsistent inconsistencies across all imported Apis across all application domains,
do a release run overriding the application domains defined in the Api.

.. code-block:: bash

  ep-async-api-importer -fp '{glob pattern to api file(s)}' -d {application-domain-name}


Application Domain
------------------

* the application domain is specified in the Api itself using extension: `$.x-ep-application-domain-name`
* specifying an application domain on the command line overrides all Api application domains

.. _importer-content-overview-asset-mapping:

Asset Mapping & Naming
----------------------

Assets are identified by their name and mapped as follows:


.. list-table:: Asset Mapping & Naming
   :widths: 25 25 50
   :header-rows: 1

   * - Async Api Element
     - Event Portal Asset
     - Naming
   * - Extension:

       $.x-ep-application-domain-name
     - Application Domain
     - Ep application domain = $.x-ep-application-domain-name
   * - Title
     - - Event Api / Event Api Version
       - Application / Application Version
     - - event api name = $.info.title
       - application name = $.info.title
   * - Version
     - - Event Api Version
       - Application Version
     - - event api version = $.info.version
       - application version = $.info.version
   * - Channel:

       - Channel topic
       - Extension: $.channel.{topic}.x-ep-event-name
       -
     - Event:

       - Event Name
       - Event Topic
       - Event Version Name
     -

       - Event Name = $.channels.{topic}.x-ep-event-name | $.channels.{topic}
       - Event Topic = $.channels.{topic}
       - Event Version Name = $.channels.{topic}.x-ep-event-name | EMPTY
   * - Channel Parameter
     - Enum / Enum Version
     - Enum name = $.channels.{topic}.parameters.{param}
   * - Channel Message
     - Schema / Schema Version
     - Schema name = $.channels.{topic}.[publish | subscribe].message


Asset Versioning Strategy
-------------------------

Event API Version / Application Version
+++++++++++++++++++++++++++++++++++++++

The version of an Event Api / Application are strictly under control of the user - i.e. the version specified in the Api file is exactly the version of the Event Api / Application.

However, in order to complete a run and avoid inconsistencies, the importer will create an Event Api Version / Application Version with a bumped patch version number and issue a warning.
(scan the log files for `WARN`)


All Other Assets
++++++++++++++++

**Enums**, **Schemas**, **Events**

For each change, a new version is created automatically.
The first version number is based on the Api version number, any further changes use the latest version number of the asset and
bump it according to strategy defined by `CLI_IMPORT_ASSETS_TARGET_VERSION_STRATEGY`.

The latest version is attached to other assets:

  - latest **Enum Version** linked to **Event Version**
  - latest **Schema Version** linked to **Event Version**
  - latest **Event Version** linked to **Event Api Version**


Asset Lifecycle State
---------------------

The importer supports two asset states: `released` and `draft`.
The asset state is controlled using the environment variable:

.. code-block:: bash

  export CLI_IMPORT_ASSETS_TARGET_LIFECYLE_STATE="released | draft"
