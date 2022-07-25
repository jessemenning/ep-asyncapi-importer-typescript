.. _importer-content-overview:

Overview
========

* import large number of apis in CI/CD pipeline into released state
* test importing apis in CI/CD pipeline before importing proper

Application Domain
------------------

* application domain is specified in the api itself using extension
* global application domain overrides all api application domains

Asset Mapping & Naming
----------------------

* assets are identified by their name and mapped as follows:

.. list-table:: Asset Mapping & Naming
   :widths: 25 25 50
   :header-rows: 1

   * - Async Api Element
     - Event Portal Asset
     - Naming
   * - Title
     - Event Api / Event Api Version
     - event api name = $.info.title
   * - Version
     - Event Api Version
     - event api version = $.info.version
   * - Channel
     - Event / Event Version
     - Event topic = $.channels[n]
   * - Channel Parameter
     - Enum / Enum Version
     - Enum name = $.channels[n].parameters[m]
   * - Channel Message
     - Schema / Schema Version
     - Schema name = $.channels[n].[publish | subscribe].message


Asset Versioning Strategy
-------------------------

Event API
+++++++++

* version of event api strictly under control of the user - i.e. the version specified in the api is exactly the version of the Event Api
* import fails if an existing Event Api version is different to the 'to be imported' api


All Other Assets
++++++++++++++++

* Enums, Schemas, Events

* for each change, new version is created automatically. version number is bumped according to strategy
* latest version is attached to other assets
  - Enum version linked to Event Version
  - Schema version linked to Event Version
  - Event version linked to Event Api Version


Asset Lifecycle State
---------------------

* all assets are in state released after successful import
