import 'mocha';
import { expect } from 'chai';
import path from 'path';
import { getUUID, TestContext, TestLogger } from '../lib/test.helpers';
import CliConfig, { TCliAppConfig } from '../../src/CliConfig';
import { CliImporter, ICliImporterRunReturn } from '../../src/CliImporter';
import { CliErrorFromEpSdkError } from '../../src/CliError';
import { TestEnv } from '../setup.spec';
import { glob } from 'glob';
import { EpSdkError, EpSdkVersionTaskStrategyValidationError } from '@solace-iot-team/ep-sdk/EpSdkErrors';
import { IEpSdkTask_TransactionLogData } from '@solace-iot-team/ep-sdk/tasks/EpSdkTask_TransactionLog';
import { EEpSdkTask_Action } from '@solace-iot-team/ep-sdk/tasks/EpSdkTask';

const scriptName: string = path.basename(__filename);
TestLogger.logMessage(scriptName, ">>> starting ...");

const createApiFileList = (subDir: string): Array<string> => {
  // const x: G.IOptions = 
  const files: Array<string> = glob.sync(`${TestEnv.testApiSpecsDir}/test-fail/${subDir}/**/*.spec.yml`);
  return files;
}

const DIR_LIST: Array<string> = [
  'new-event-same-version',
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
      // DEBUG
      // expect(false, TestLogger.createLogMessage('check list', TEST_LISTS)).to.be.true;
    });

    it(`${scriptName}: should validate errors for importing test-fail specs`, async () => {
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
        expect(e instanceof CliErrorFromEpSdkError, TestLogger.createNotCliErrorMesssage(e.message)).to.be.true;
        const cliErrorFromEpSdkError: CliErrorFromEpSdkError = e;
        const epSdkError: EpSdkError = cliErrorFromEpSdkError.epSdkError;
        expect(epSdkError instanceof EpSdkVersionTaskStrategyValidationError, TestLogger.createWrongEpSdkErrorMesssage(epSdkError)).to.be.true;
        const epSdkVersionTaskStrategyValidationError: EpSdkVersionTaskStrategyValidationError = epSdkError as EpSdkVersionTaskStrategyValidationError;
        // const details: TEpSdkVersionTaskStrategyValidationError_Details = epSdkVersionTaskStrategyValidationError.details;
        const transactionLogData: IEpSdkTask_TransactionLogData = epSdkVersionTaskStrategyValidationError.details.transactionLogData;
        expect(transactionLogData.epSdkTask_Action, TestLogger.createEpSdkTestFailMessage('failed', e)).to.eq(EEpSdkTask_Action.NO_ACTION);
        expect(transactionLogData.epSdkTask_IsUpdateRequiredFuncReturn.isUpdateRequired, TestLogger.createEpSdkTestFailMessage('failed', e)).to.be.true;
      }
    });

});

