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
import { CliError } from "../src/CliError";
import {
  EpSdkApplicationDomainsService,
  EpSdkClient
}from '@solace-labs/ep-sdk';
import { 
  ApplicationDomain, 
  OpenAPI 
} from '@solace-labs/ep-openapi-node';
import { TestServices } from "./lib/TestServices";

// ensure any unhandled exception cause exit = 1
function onUncaught(err: any){
  console.log(err);
  process.exit(1);
}
process.on('unhandledRejection', onUncaught);
// // this does not catch ctrl-c
// async function onExit() {
//   console.log('onExit: delete all application domains');
//   const xvoid: void = await TestServices.absent_ApplicationDomains();
//   console.log('onExit: done');
//   process.exit(1);
// }
// process.on('exit', onExit);

const scriptName: string = path.basename(__filename);
const scriptDir: string = path.dirname(__filename);

TestLogger.setLogging(true);
TestLogger.logMessage(scriptName, ">>> initializing ...");

const setTestEnv = (scriptDir: string): TTestEnv => { 
  let testRootDir = scriptDir;
  if(!scriptDir.includes('test')) testRootDir = path.join(scriptDir, 'test');
  const projectRootDir = path.join(testRootDir, '../..');
  const CLI_TEST_API_SPECS_ROOT_DIR = getMandatoryEnvVarValue(scriptName, "CLI_TEST_API_SPECS_ROOT_DIR"); 
  const CLI_TEST_ENABLE_API_CALL_LOGGING = getOptionalEnvVarValueAsBoolean(scriptName, "CLI_TEST_ENABLE_API_CALL_LOGGING", false);
  const testEnv: TTestEnv = {
    projectRootDir: projectRootDir,
    testApiSpecsDir: path.join(projectRootDir, CLI_TEST_API_SPECS_ROOT_DIR),
    enableLogging: true,
    enableApiLogging: CLI_TEST_ENABLE_API_CALL_LOGGING,
    // globalDomainNamePrefix: `sep-async-api-importer/test/${getUUID()}`,
    createdAppDomainNameList: [],
    testRunId: getUUID()
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
  console.log(`${scriptName}: AFTER ALL: start ...`);
  // TestContext.newItId();
  // // disable for DEBUG
  // for(const createdDomain of TestEnv.createdAppDomainNameList) {
  //   const deleted: ApplicationDomain = await EpSdkApplicationDomainsService.deleteByName({ applicationDomainName: createdDomain });
  //   console.log(TestLogger.createLogMessage(`deleted application domain=${JSON.stringify(deleted, null, 2)}`));
  // }
  console.log(`${scriptName}: AFTER ALL: done.`);
});

describe(`${scriptName}`, () => {
  context(`${scriptName}`, () => {

    beforeEach(() => {
      TestContext.newItId();
    });

    it(`${scriptName}: should initialize cli`, async () => {
      try {
        CliConfig.validate_CliConfigEnvVarConfigList();
        CliLogger.initialize({ cliLoggerOptions: CliConfig.getDefaultLoggerOptions() });
        CliConfig.initialize({
          defaultAppName: 'ep-async-api-importer-test',
          fileList: [],
        });
        CliLogger.initialize({ cliLoggerOptions: CliConfig.getCliLoggerOptions() });
        CliConfig.logConfig();
        EpSdkClient.initialize({
          globalOpenAPI: OpenAPI,
          token: CliConfig.getSolaceCloudToken(),
          baseUrl: CliConfig.getEpApiBaseUrl()
        });
        // DEBUG
        // expect(false, TestLogger.createLogMessage('OpenApi', OpenAPI )).to.be.true;
      } catch (e) {
        expect(e instanceof CliError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
        expect(false, TestLogger.createTestFailMessageWithCliError('failed', e)).to.be.true;
      }

    });

  });
});

