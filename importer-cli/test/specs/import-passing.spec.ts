import 'mocha';
import { expect } from 'chai';
import path from 'path';
import { TestContext, TestLogger } from '../lib/test.helpers';
import CliConfig, { TCliAppConfig } from '../../src/CliConfig';
import { CliImporter, ICliImporterRunReturn } from '../../src/CliImporter';
import { CliError } from '../../src/CliError';
import { TestEnv } from '../setup.spec';
import { glob } from 'glob';

const scriptName: string = path.basename(__filename);
TestLogger.logMessage(scriptName, ">>> starting ...");

const createGoodApiSpecFileList = (): Array<string> => {

  // const x: G.IOptions = 
  const files: Array<string> = glob.sync(`${TestEnv.testApiSpecsDir}/passing/**/*.spec.yml`);

  return files;

}

let ApiFileList: Array<string> = [];

describe(`${scriptName}`, () => {
    
    beforeEach(() => {
      TestContext.newItId();
    });

    it(`${scriptName}: should create api spec file list `, async () => {
      ApiFileList = createGoodApiSpecFileList();
    });

    it(`${scriptName}: should import all passing specs`, async () => {
      try {
        for(const specFile of ApiFileList) {
          const cliAppConfig: TCliAppConfig = {
            ...CliConfig.getCliAppConfig(),
            asyncApiFileName: specFile,
          };

          console.log(`cliAppConfig=${JSON.stringify(cliAppConfig, null, 2)}`);

          const importer = new CliImporter(cliAppConfig);
          const cliImporterRunReturn: ICliImporterRunReturn = await importer.run();  
          if(cliImporterRunReturn.error !== undefined) throw cliImporterRunReturn.error;
    
        }
      } catch(e) {
        expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
        expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
      }
    });

    xit(`${scriptName}: idempotency: should import all passing specs`, async () => {
      try {
        for(const specFile of ApiFileList) {
          const cliAppConfig: TCliAppConfig = {
            ...CliConfig.getCliAppConfig(),
            asyncApiFileName: specFile,
          };
          const importer = new CliImporter(cliAppConfig);
          await importer.run();  
        }
      } catch(e) {
        expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
        expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
      }
    });

});

