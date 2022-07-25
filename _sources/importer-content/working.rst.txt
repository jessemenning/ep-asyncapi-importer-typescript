.. _importer-content-working:

Working Examples
================

Example 1
---------

Apis
++++

* 2 apis to import & release
  - specs/acme-retail/till.spec.yml
  - specs/acme-retail/analytics.spec.yml

* both apis have channels & messages in common, albeit in different operations


Goal
++++

* import both apis into Event Portal
* ensure both apis have EXACTLY the same definition for a Channel & Message - i.e. use EXACTLY the same Event.

Simple Process
++++++++++++++

* Import both apis into a test application domain

.. code-block:: bash

  sep-async-api-importer -fp 'specs/acme-retail/**/*.spec.yml' -d test/acme-retail


* Check report of what has been imported.


* Import again to ensure all channels & messages are exactly the same across both apis

.. code-block:: bash

  sep-async-api-importer -fp 'specs/acme-retail/**/*.spec.yml' -d test/acme-retail

* Check report that actually nothing has been imported


**Possible Errors**

* the second import runs a check:

  - retrieve the current Event Api Version and compare with the to-be-imported api
  - if it detects a change it will abort, reporting the changes it would have to apply


* this way, naming errors and inconsistencies across apis for Channels, Messages, and Parameters can be detected.
