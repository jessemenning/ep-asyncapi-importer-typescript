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

const scriptName: string = path.basename(__filename);
TestLogger.logMessage(scriptName, ">>> starting ...");

// const createApiFileList = (subDir: string): Array<string> => {
//   // const x: G.IOptions = 
//   const files: Array<string> = glob.sync(`${TestEnv.testApiSpecsDir}/passing/${subDir}/**/*.spec.yml`);
//   return files;
// }

// const DIR_LIST: Array<string> = [
//   'acme-retail',
//   // 'acme-rideshare',
//   // 'asynapi',
// ];

// type TDomainFileList = {
//   domainName: string;  
//   apiFileList: Array<string>;
// }
// type TTestLists = Array<TDomainFileList>;
// const TEST_LISTS: TTestLists = [];


describe(`${scriptName}`, () => {
    
  before(async() => {
    //parse all specs and create list: file, epAsyncApiDocument, delete all app domains
    const fileList = CliUtils.createFileList(`${TestEnv.testApiSpecsDir}/passing/**/*.spec.yml`);
    CliConfig.getCliImporterOptions().asyncApiFileList = fileList;
    CliConfig.getCliImporterOptions().cliImporterMode = ECliImporterMode.TEST_MODE;

    console.log(`BEFORE cliConfig=\n${JSON.stringify(CliConfig.getCliConfig(), null, 2)}`);

  });

  beforeEach(() => {
    TestContext.newItId();
  });

  after(async() => {
  // - after import: test ep assets & versions are correctly imported as in epAsyncApiDocument
  // - after: delete all created app domains

  console.log(`AFTER cliConfig=\n${JSON.stringify(CliConfig.getCliConfig(), null, 2)}`);

  });

  it(`${scriptName}: should say hello`, async () => {

      expect(false, 'hello test').to.be.true;


    });


// - import: use test_mode_keep

    // it(`${scriptName}: should setup test`, async () => {
    //   const fileList = CliUtils.createFileList(`${TestEnv.testApiSpecsDir}/passing/**/*.spec.yml`);
    //   CliConfig.getCliImporterOptions().asyncApiFileList = fileList;
    //   CliConfig.getCliImporterOptions().cliImporterMode = ECliImporterMode.TEST_MODE;

    //   // // get a list of application domains that will be created for deletion after
    //   // for(const apiFile of fileList) {
    //   //   const epAsyncApiDocument: EpAsyncApiDocument = await CliAsyncApiDocumentService.parse_and_validate({
    //   //     apiFile: apiFile,
    //   //     applicationDomainName: CliConfig.getCliImporterOptions().applicationDomainName,
    //   //     applicationDomainNamePrefix: applicationDomainNamePrefix,
    //   //   });
    //   //   applicationDomainNameList.push(epAsyncApiDocument.getApplicationDomainName());  
    //   // }
    //   console.log(`cliConfig=\n${JSON.stringify(CliConfig.getCliConfig(), null, 2)}`);

    //   // expect(false, JSON.stringify(CliConfig.getCliConfig(), null, 2)).to.be.true;


    // });

    // it(`${scriptName}: should import passing specs`, async () => {
    //   try {
    //     const cliImporter = new CliImporter(CliConfig.getCliImporterOptions());
    //     const xvoid: void = await cliImporter.run();      
    //     const cliRunSummaryList: Array<ICliRunSummary_Base> = CliRunSummary.getSummaryLogList();
    //     // DEBUG
    //     // expect(false, JSON.stringify(cliRunSummaryList, null, 2)).to.be.true;
    //   } catch(e) {
    //     expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
    //     expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
    //   }
    // });

    // // // this test makes no sense
    // // it(`${scriptName}: should import passing specs: idempotency test of specs`, async () => {
    // //   try {
    // //     const cliImporter = new CliImporter(CliConfig.getCliImporterOptions());
    // //     const xvoid: void = await cliImporter.run();      
    // //     const cliRunSummaryList: Array<ICliRunSummary_Base> = CliRunSummary.getSummaryLogList();
    // //     // DEBUG
    // //     // expect(false, JSON.stringify(cliRunSummaryList, null, 2)).to.be.true;
    // //   } catch(e) {
    // //     expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
    // //     expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
    // //   }
    // // });

});

