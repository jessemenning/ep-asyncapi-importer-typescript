import 'mocha';
import { expect } from 'chai';
import path from 'path';
import { TestContext, TestLogger } from '../lib/test.helpers';
import CliConfig, { TCliAppConfig } from '../../src/CliConfig';
import { CliImporter } from '../../src/CliImporter';
import { CliError } from '../../src/CliError';
import { TestEnv } from '../setup.spec';
import G, { glob } from 'glob';

const scriptName: string = path.basename(__filename);
TestLogger.logMessage(scriptName, ">>> starting ...");

const createGoodApiSpecFileList = (): Array<string> => {

  // const x: G.IOptions = 
  const files: Array<string> = glob.sync(`${TestEnv.testApiSpecsDir}/**/*.spec.yml`);

  return files;

}

let ApiSpecFileList: Array<string> = [];

describe(`${scriptName}`, () => {
    
    beforeEach(() => {
      TestContext.newItId();
    });

    it(`${scriptName}: should create api spec file list `, async () => {
      ApiSpecFileList = createGoodApiSpecFileList();
    });

    it(`${scriptName}: should import all good specs`, async () => {
      try {
        for(const specFile of ApiSpecFileList) {
          const cliAppConfig: TCliAppConfig = {
            ...CliConfig.getCliAppConfig(),
            asyncApiSpecFileName: specFile,
          };
          const importer = new CliImporter(cliAppConfig);
          await importer.run();  
        }
      } catch(e) {
        expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
        expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
      }
    });

    it(`${scriptName}: idempotency: should import all good specs`, async () => {
      try {
        for(const specFile of ApiSpecFileList) {
          const cliAppConfig: TCliAppConfig = {
            ...CliConfig.getCliAppConfig(),
            asyncApiSpecFileName: specFile,
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

