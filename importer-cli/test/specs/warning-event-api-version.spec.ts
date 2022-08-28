import 'mocha';
import { expect } from 'chai';
import path from 'path';
import { TestContext, TestLogger } from '../lib/test.helpers';
import CliConfig from '../../src/CliConfig';
import { CliError } from '../../src/CliError';
import { TestEnv } from '../setup.spec';
import CliRunSummary, { ICliImportSummary, ICliRunSummary_Base } from '../../src/CliRunSummary';
import { CliUtils } from '../../src/CliUtils';
import { TestServices, T_TestApiSpecRecord } from '../lib/TestServices';
import { CliImporterManager, ECliImporterManagerMode } from '../../src/CliImporterManager';
import { EpAsyncApiDocument } from '@solace-labs/ep-asyncapi';
import { EpSdkApplicationDomainsService, EpSdkEventApiVersionsService, EpSdkSemVerUtils } from '@solace-labs/ep-sdk';
import { ApplicationDomain, eventApiVersion as EventApiVersion } from '@solace-labs/ep-openapi-node';
import { EEpSdk_VersionStrategy } from '@solace-labs/ep-sdk/dist/utils/EpSdkSemVerUtils';

const scriptName: string = path.basename(__filename);
TestLogger.logMessage(scriptName, ">>> starting ...");

const setupTestOptions = (): Array<string> => {
  // create test specific list
  const fileList = CliUtils.createFileList(`${TestEnv.testApiSpecsDir}/single-tests/warning-event-api-version.spec.yml`);
  // set test specific importer options
  CliConfig.getCliImporterManagerOptions().asyncApiFileList = fileList;
  CliConfig.getCliImporterManagerOptions().cliImporterManagerMode = ECliImporterManagerMode.RELEASE_MODE;
  // CliConfig.getCliImporterManagerOptions().runId = scriptName;
  // // DEBUG
  // CliConfig.getCliImporterManagerOptions().cliImporterManagerMode = ECliImporterManagerMode.TEST_MODE_KEEP;
  // CliConfig.getCliImporterManagerOptions().applicationDomainName = 'release_mode';
  CliConfig.getCliImporterManagerOptions().createEventApiApplication = false;
  return fileList;
}

describe(`${scriptName}`, () => {
    
  before(async() => {
    console.log(`${scriptName}: BEFORE: setup test & clean app domains ...`);
    // create test specific list
    const fileList = setupTestOptions();
    //parse all specs
    try {
      const testApiSpecRecordList: Array<T_TestApiSpecRecord> = await TestServices.createTestApiSpecRecordList({
        apiFileList: fileList,
        overrideApplicationDomainName: CliConfig.getCliImporterManagerOptions().applicationDomainName,
        // prefixApplicationDomainName: CliImporterManager.createApplicationDomainPrefix({
        //   appName: CliConfig.getCliImporterManagerOptions().appName,
        //   runId: CliConfig.getCliImporterManagerOptions().runId
        // })
      });
      // ensure all app domains are absent
      const xvoid: void = await TestServices.absent_ApplicationDomains(false);
    } catch(e) {
      expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
      expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
    }
    console.log(`${scriptName}: BEFORE: done.`);
  });

  beforeEach(() => {
    TestContext.newItId();
  });

  after(async() => {
    console.log(`${scriptName}: AFTER: check and cleanup ...`);
    let err: Error | undefined = undefined;
    try {
      // test ep assets & versions are correctly imported as in epAsyncApiDocument
      const pass: boolean = await TestServices.checkAssetsCreatedAsExpected();
      expect(pass, `${scriptName}: AFTER checks not passed`).to.be.true;
    } catch(e) {
      err = e;
    } finally {
      // ensure all app domains are absent
      console.log(`${scriptName}: AFTER: delete all application domains ...`);
      const xvoid: void = await TestServices.absent_ApplicationDomains(CliConfig.getCliImporterManagerOptions().cliImporterManagerMode === ECliImporterManagerMode.TEST_MODE_KEEP);
      console.log(`${scriptName}: AFTER: delete all application domains done.`);
    }
    expect(err, TestLogger.createNotCliErrorMesssage(JSON.stringify(err))).to.be.undefined;
    console.log(`${scriptName}: AFTER: done.`);
  });

  it(`${scriptName}: should import specs`, async () => {
    try {
      const cliImporter = new CliImporterManager(CliConfig.getCliImporterManagerOptions());
      const xvoid: void = await cliImporter.run();      
      const cliRunSummaryList: Array<ICliRunSummary_Base> = CliRunSummary.getSummaryLogList();
      // DEBUG
      // expect(false, JSON.stringify(cliRunSummaryList, null, 2)).to.be.true;
    } catch(e) {
      expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
      expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
    }
  });

  it(`${scriptName}: should create new version`, async () => {
    try {
      const testApiSpecRecordList: Array<T_TestApiSpecRecord> = TestServices.testApiSpecRecordList;
      expect(testApiSpecRecordList.length, TestLogger.createLogMessage('testApiSpecRecordList.length !== 1', testApiSpecRecordList)).to.eq(1);
      const epAsyncApiDocument: EpAsyncApiDocument = testApiSpecRecordList[0].epAsyncApiDocument;
      // get latest version
      const applicationDomainName = epAsyncApiDocument.getApplicationDomainName();
      const applicationDomain: ApplicationDomain | undefined = await EpSdkApplicationDomainsService.getByName({ applicationDomainName: applicationDomainName });
      expect(applicationDomain, TestLogger.createLogMessage('applicationDomain undefined', { applicationDomainName: applicationDomainName})).not.to.be.undefined;
      const applicationDomainId = applicationDomain.id;
      const eventApiName = epAsyncApiDocument.getTitle();
      const latestEventApiVersion: EventApiVersion = await EpSdkEventApiVersionsService.getLatestVersionForEventApiName({
        applicationDomainId: applicationDomainId,
        eventApiName: eventApiName
      });
      expect(latestEventApiVersion, TestLogger.createLogMessage('latestEventApiVersion undefined', { 
        applicationDomainId: applicationDomainId,
        eventApiName: eventApiName
      })).not.to.be.undefined;
      // create a new version
      const eventApiId = latestEventApiVersion.eventApiId;
      const latestVersionString = latestEventApiVersion.version; 
      const newVersionString = EpSdkSemVerUtils.createNextVersionByStrategy({ fromVersionString:latestVersionString, strategy: EEpSdk_VersionStrategy.BUMP_MINOR });
      await EpSdkEventApiVersionsService.createEventApiVersion({
        applicationDomainId: applicationDomainId,
        eventApiId: eventApiId,
        eventApiVersion: {
          ...latestEventApiVersion,
          version: newVersionString
        },
        targetLifecycleStateId: latestEventApiVersion.stateId
      });
      // const newEventApiVersion: EventApiVersion = await EpSdkEventApiVersionsService.getLatestVersionForEventApiId({ applicationDomainId: applicationDomainId, eventApiId: eventApiId });
      // expect(newEventApiVersion.version, TestLogger.createLogMessage('newEventApiVersion.version !== newVersionString', {
      //   newEventApiVersion: newEventApiVersion,
      //   newVersionString: newVersionString
      // })).to.eq(newVersionString);
      // DEBUG
      // expect(false, JSON.stringify(cliRunSummaryList, null, 2)).to.be.true;
    } catch(e) {
      expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
      expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
    }
  });

  it(`${scriptName}: should import specs: with warnings`, async () => {
    try {
      const cliImporter = new CliImporterManager(CliConfig.getCliImporterManagerOptions());
      const xvoid: void = await cliImporter.run();      
      const cliRunSummaryList: Array<ICliRunSummary_Base> = CliRunSummary.getSummaryLogList();
      const cliImportSummary: ICliImportSummary = CliRunSummary.createImportSummary(CliConfig.getCliImporterManagerOptions().cliImporterManagerMode);
      expect(cliImportSummary.warnings.length, TestLogger.createLogMessage('cliImportSummary.warnings.length !== 1', cliImportSummary.warnings)).to.eq(1);
      // // DEBUG
      // expect(false, JSON.stringify(cliRunSummaryList, null, 2)).to.be.true;
    } catch(e) {
      expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
      expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
    }
  });

});

