import 'mocha';
import { expect } from 'chai';
import path from 'path';
import { TestContext, TestLogger } from '../lib/test.helpers';
import CliConfig from '../../src/CliConfig';
import { CliError } from '../../src/CliError';
import { TestEnv } from '../setup.spec';
import CliRunSummary, { ICliRunSummary_Base } from '../../src/CliRunSummary';
import { CliUtils } from '../../src/CliUtils';
import { TestServices, T_TestApiSpecRecord } from '../lib/TestServices';
import { CliImporterManager, ECliImporterManagerMode } from '../../src/CliImporterManager';

const scriptName: string = path.basename(__filename);
TestLogger.logMessage(scriptName, ">>> starting ...");

const setupTestOptions = (): Array<string> => {
  // create test specific list
  const fileList = CliUtils.createFileList(`${TestEnv.testApiSpecsDir}/passing/**/*.spec.yml`);
  // set test specific importer options
  CliConfig.getCliImporterManagerOptions().asyncApiFileList = fileList;
  CliConfig.getCliImporterManagerOptions().cliImporterManagerMode = ECliImporterManagerMode.TEST_MODE_KEEP;
  CliConfig.getCliImporterManagerOptions().applicationDomainName = undefined;
  CliConfig.getCliImporterManagerOptions().createEventApiApplication = false;
  return fileList;
}

describe(`${scriptName}`, () => {
    
  before(async() => {
    console.log(`${scriptName}: BEFORE: setup test & clean app domains ...`);
    // create test specific list
    const fileList = setupTestOptions();
    try {
      //parse all specs
      const testApiSpecRecordList: Array<T_TestApiSpecRecord> = await TestServices.createTestApiSpecRecordList({
        apiFileList: fileList,
        overrideApplicationDomainName: CliConfig.getCliImporterManagerOptions().applicationDomainName,
        prefixApplicationDomainName: CliImporterManager.createApplicationDomainPrefix({
          appName: CliConfig.getCliImporterManagerOptions().appName,
          runId: CliConfig.getCliImporterManagerOptions().runId
        })
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

  it(`${scriptName}: should import specs with application / version`, async () => {
    try {
      CliConfig.getCliImporterManagerOptions().createEventApiApplication = true;

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

});

