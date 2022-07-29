import 'mocha';
import { expect } from 'chai';
import path from 'path';
import { getUUID, TestContext, TestLogger } from '../lib/test.helpers';
import CliConfig, { TCliAppConfig } from '../../src/CliConfig';
import { CliImporter, ICliImporterRunReturn } from '../../src/CliImporter';
import { CliError } from '../../src/CliError';
import { TestEnv } from '../setup.spec';
import { glob } from 'glob';

const scriptName: string = path.basename(__filename);
TestLogger.logMessage(scriptName, ">>> starting ...");

const createApiFileList = (subDir: string): Array<string> => {
  // const x: G.IOptions = 
  const files: Array<string> = glob.sync(`${TestEnv.testApiSpecsDir}/passing/${subDir}/**/*.spec.yml`);
  return files;
}

const DIR_LIST: Array<string> = [
  'acme-retail',
  // 'acme-rideshare',
  // 'asynapi',
];

type TDomainFileList = {
  domainName: string;  
  apiFileList: Array<string>;
}
type TTestLists = Array<TDomainFileList>;
const TEST_LISTS: TTestLists = [];


describe(`${scriptName}`, () => {
    
    beforeEach(() => {
      TestContext.newItId();
    });

    it(`${scriptName}: should setup domains and api file lists`, async () => {
      for(const dir of DIR_LIST) {
        const domainFileList: TDomainFileList = {
          domainName: `${TestEnv.globalDomainNamePrefix}/${dir}`,
          apiFileList: createApiFileList(dir)
        }
        TEST_LISTS.push(domainFileList);
        TestEnv.createdAppDomainNameList.push(domainFileList.domainName);
      }
    });

    it(`${scriptName}: should import passing specs`, async () => {
      try {
        for(const testList of TEST_LISTS) {
          for(const apiFile of testList.apiFileList) {
            const cliAppConfig: TCliAppConfig = {
              ...CliConfig.getCliAppConfig(),
              asyncApiFileName: apiFile,
              domainName: testList.domainName,
              apiTransactionId: getUUID(),
            };
            const importer = new CliImporter(cliAppConfig);
            const cliImporterRunReturn: ICliImporterRunReturn = await importer.run();  
            if(cliImporterRunReturn.error !== undefined) throw cliImporterRunReturn.error;      
          }
        }
      } catch(e) {
        expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
        expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
      }
    });

    it(`${scriptName}: idempotency: should import passing specs`, async () => {
      try {
        for(const testList of TEST_LISTS) {
          for(const apiFile of testList.apiFileList) {
            const cliAppConfig: TCliAppConfig = {
              ...CliConfig.getCliAppConfig(),
              asyncApiFileName: apiFile,
              domainName: testList.domainName
            };
            const importer = new CliImporter(cliAppConfig);
            const cliImporterRunReturn: ICliImporterRunReturn = await importer.run();  
            if(cliImporterRunReturn.error !== undefined) throw cliImporterRunReturn.error;      
          }
        }
      } catch(e) {
        expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
        expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
      }
    });

});

