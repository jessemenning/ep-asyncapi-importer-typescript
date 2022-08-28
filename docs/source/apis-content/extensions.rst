.. _apis-content-extensions:

Async Api Extensions
====================

The importer uses the following extensions:

.. list-table:: Aysnc Api Extensions
   :widths: 50 50
   :header-rows: 1

   * - Async Api Extension
     - Description
   * - $.x-ep-application-domain
     - The Event Portal application domain
   * - $.channels.{topic}.x-ep-event-name
     - The name to use for Event Portal Events and Event Versions.

       If not specified, falls back to:

       - Event Name = $.channel.{topic}
       - Event Version Name = EMPTY
