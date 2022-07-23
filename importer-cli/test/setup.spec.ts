import "mocha";
import path from 'path';
import fs from 'fs';
import { 
  getMandatoryEnvVarValue,
  getOptionalEnvVarValueAsBoolean, 
  getUUID, 
  TestContext, 
  TestLogger, 
  TTestEnv,
} from './lib/test.helpers';
import { expect } from 'chai';
import CliConfig from "../src/CliConfig";
import { CliLogger } from "../src/CliLogger";
import { EPClient } from "../src/EPClient";
import { CliError } from "../src/CliError";
import CliEPApplicationDomainsService from "../src/services/CliEPApplicationDomainsService";

// ensure any unhandled exception cause exit = 1
function onUncaught(err: any){
  console.log(err);
  process.exit(1);
}
process.on('unhandledRejection', onUncaught);

const scriptName: string = path.basename(__filename);
const scriptDir: string = path.dirname(__filename);

TestLogger.setLogging(true);
TestLogger.logMessage(scriptName, ">>> initializing ...");

const setTestEnv = (scriptDir: string): TTestEnv => { 
  let testRootDir = scriptDir;
  if(!scriptDir.includes('test')) testRootDir = path.join(scriptDir, 'test');
  const projectRootDir = path.join(testRootDir, '../..');
  const CLI_TEST_API_SPECS_ROOT_DIR = getMandatoryEnvVarValue(scriptName, "CLI_TEST_API_SPECS_ROOT_DIR"); 
  const testEnv: TTestEnv = {
    enableLogging: getOptionalEnvVarValueAsBoolean(scriptName, 'APIM_TEST_SERVER_ENABLE_LOGGING', true),
    projectRootDir: projectRootDir,
    testApiSpecsDir: path.join(projectRootDir, CLI_TEST_API_SPECS_ROOT_DIR),
    globalDomainNamePrefix: `sep-async-api-importer/test/${getUUID()}`,
    createdAppDomainNameList: [],
  }
  return testEnv;
}
// init testEnv
export const TestEnv = setTestEnv(scriptDir);
TestLogger.logTestEnv(scriptName, TestEnv);
TestLogger.setLogging(TestEnv.enableLogging);
TestContext.setTestEnv(TestEnv);

before(async() => {
  TestContext.newItId();
  // test environment
  expect(fs.existsSync(TestEnv.testApiSpecsDir), TestLogger.createTestFailMessage(`testApiSpecsDir does not exist = ${TestEnv.testApiSpecsDir}`)).to.be.true;
  // // init OpenAPI
  // const base: string = getBaseUrl(TestEnv.protocol, TestEnv.host, TestEnv.port, TestEnv.apiBase);
  // ApimServerAPIClient.initialize(base);
});

after(async() => {
  TestContext.newItId();
  // // disable for testing
  // for(const createdDomain of TestEnv.createdAppDomainNameList) {
  //   await CliEPApplicationDomainsService.deleteByName({ applicationDomainName: createdDomain });
  // }
});

describe(`${scriptName}`, () => {
  context(`${scriptName}`, () => {

    beforeEach(() => {
      TestContext.newItId();
    });

    it(`${scriptName}: should initialize cli`, async () => {
      try {
        CliConfig.initialize({ 
          globalDomainName: TestEnv.globalDomainNamePrefix
        });
        CliLogger.initialize(CliConfig.getCliLoggerConfig());
        CliConfig.logConfig();
        EPClient.initialize({
          token: CliConfig.getSolaceCloudToken(),
          baseUrl: CliConfig.getCliEpApiConfig().epApiBaseUrl
        });      
      } catch (e) {
        expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
        expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
      }

    });

  });
});

