import 'mocha';
import { expect } from 'chai';
import path from 'path';
import { TestContext, TestLogger } from '../lib/test.helpers';
import CliConfig from '../../src/CliConfig';
import { CliImporter, ECliImporterMode } from '../../src/CliImporter';
import { CliError } from '../../src/CliError';
import { TestEnv } from '../setup.spec';
import CliRunSummary, { ICliRunSummary_Base } from '../../src/CliRunSummary';
import { CliUtils } from '../../src/CliUtils';
import { EpAsyncApiDocument } from '@solace-labs/ep-asyncapi';
import CliAsyncApiDocumentService from '../../src/services/CliAsyncApiDocumentService';
import CliApplicationDomainsService from '../../src/services/CliApplicationDomainsService';
import { TestServices, T_TestApiSpecRecord } from '../lib/TestServices';

const scriptName: string = path.basename(__filename);
TestLogger.logMessage(scriptName, ">>> starting ...");

const setupTestOptions = (): Array<string> => {
  // create test specific list
  const fileList = CliUtils.createFileList(`${TestEnv.testApiSpecsDir}/passing/**/*.spec.yml`);
  // set test specific importer options
  CliConfig.getCliImporterOptions().asyncApiFileList = fileList;
  CliConfig.getCliImporterOptions().cliImporterMode = ECliImporterMode.TEST_MODE_KEEP;
  CliConfig.getCliImporterOptions().applicationDomainName = undefined;
  return fileList;
}

describe(`${scriptName}`, () => {
    
  before(async() => {
    console.log('BEFORE: setup test & clean app domains ...');
    // create test specific list
    const fileList = setupTestOptions();
    //parse all specs
    const testApiSpecRecordList: Array<T_TestApiSpecRecord> = await TestServices.createTestApiSpecRecordList({
      apiFileList: fileList,
      overrideApplicationDomainName: CliConfig.getCliImporterOptions().applicationDomainName,
      prefixApplicationDomainName: CliImporter.createApplicationDomainPrefix({
        appName: CliConfig.getCliImporterOptions().appName,
        runId: CliConfig.getCliImporterOptions().runId
      })
    });
    // ensure all app domains are absent
    const xvoid: void = await TestServices.absent_ApplicationDomains();
  });

  beforeEach(() => {
    TestContext.newItId();
  });

  after(async() => {
    let err: Error | undefined = undefined;
    try {
      // test ep assets & versions are correctly imported as in epAsyncApiDocument
      const pass: boolean = await TestServices.checkAssetsCreatedAsExpected();
      expect(pass, 'AFTER checks not passed').to.be.true;
    } catch(e) {
      err = e;
    } finally {
      // ensure all app domains are absent
      console.log('CLEAN-UP AFTER: delete all application domains');
      const xvoid: void = await TestServices.absent_ApplicationDomains();
    }
    expect(err, TestLogger.createNotCliErrorMesssage(`${err.name}: ${err.message}`)).to.be.undefined;
  });

  it(`${scriptName}: should import specs`, async () => {
    try {
      const cliImporter = new CliImporter(CliConfig.getCliImporterOptions());
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

