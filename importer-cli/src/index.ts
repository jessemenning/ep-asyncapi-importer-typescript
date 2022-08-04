#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import path from 'path';
import CliConfig, { ECliImporterMode, TCliAppConfig } from './CliConfig';
import { CliLogger, ECliStatusCodes } from './CliLogger';
import dotenv from 'dotenv';
import { CliImporter, ICliImporterRunReturn } from './CliImporter';
import { Command, OptionValues } from 'commander';
import { glob } from 'glob';
import { CliUsageError } from './CliError';
import { ApplicationDomain } from '@solace-iot-team/ep-openapi-node';
import { EpSdkClient } from '@solace-iot-team/ep-sdk';
import { EpSdkApplicationDomainsService } from '@solace-iot-team/ep-sdk';


import { CliUtils } from './CliUtils';

dotenv.config();
const packageJson = require('../package.json');

const ComponentName: string = path.basename(__filename);

const createApiSpecFileList = (filePattern: string): Array<string> => {
  const files: Array<string> = glob.sync(filePattern);
  return files;
}

async function rollback({ }:{
}): Promise<void> {
  const funcName = 'rollback';
  const logName = `${ComponentName}.${funcName}()`;

  CliLogger.warn(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'TODO: implement rollback', details: {
    importerMode: CliConfig.getCliAppConfig().importerMode,
  }}));
}

async function deleteApplicationDomains({ applicationDomainNameList }:{
  applicationDomainNameList: Array<string>;
}): Promise<void> {
  const funcName = 'deleteApplicationDomains';
  const logName = `${ComponentName}.${funcName}()`;

  for(const applicationDomainName of applicationDomainNameList) {
    try {
      const applicationDomain: ApplicationDomain = await EpSdkApplicationDomainsService.deleteByName( { 
        applicationDomainName: applicationDomainName
      });
      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'application domain deleted', details: {
        importerMode: CliConfig.getCliAppConfig().importerMode,
        applicationDomain: applicationDomain
      }}));
    } catch(e) {
      // may already have been deleted, do nothing
    }
  }
}

async function run_test_mode_before_release_mode() {
  const funcName = 'run_test_mode_before_release_mode';
  const logName = `${ComponentName}.${funcName}()`;

  if(CliConfig.getCliAppConfig().importerMode === ECliImporterMode.TEST_MODE) return;

  // re-configure app config for test mode
  const copyOfCliAppConfig: TCliAppConfig = CliConfig.getCopyOfCliAppConfig();
  const testModeAppConfig: TCliAppConfig = {
    ...copyOfCliAppConfig,
    importerMode: ECliImporterMode.TEST_MODE,
  };
  testModeAppConfig.prefixDomainName = CliConfig.createPrefixDomainName({ cliConfig: {
    ...CliConfig.getConfig(),
    appConfig: testModeAppConfig
  }});

  // keep track of applicationDomains 
  const applicationDomainNameList: Array<string> = [];

  try {
    for(const asyncApiFile of CliConfig.getCliAppConfig().asyncApiFileList) {

      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'starting...', details: {
        asyncApiFile: asyncApiFile
      }}));

      const cliAppConfig: TCliAppConfig = {
        ...testModeAppConfig,
        asyncApiFileName: asyncApiFile,
        apiTransactionId: CliUtils.getUUID(),
      };

      const importer = new CliImporter(cliAppConfig);
      const cliImporterRunReturn: ICliImporterRunReturn = await importer.run();  
      if(cliImporterRunReturn.applicationDomainName !== undefined) applicationDomainNameList.push(cliImporterRunReturn.applicationDomainName);
      if(cliImporterRunReturn.error !== undefined) throw cliImporterRunReturn.error;

      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'done.', details: {
        asyncApiFile: asyncApiFile,
      }}));

    }
    const xvoid: void = await deleteApplicationDomains({ applicationDomainNameList: applicationDomainNameList });
        
  } catch(e) {

    const xvoid: void = await deleteApplicationDomains({ applicationDomainNameList: applicationDomainNameList });
  
    CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ERROR, details: {
      error: e
    }}));

    throw e;

  }

}


async function main() {
  const funcName = 'main';
  const logName = `${ComponentName}.${funcName}()`;

  CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'starting...', details: {
    cliAppConfig: CliConfig.getCliAppConfig()
  }}));

  await run_test_mode_before_release_mode();

  // keep track of applicationDomains 
  const applicationDomainNameList: Array<string> = [];

  try {
    for(const asyncApiFile of CliConfig.getCliAppConfig().asyncApiFileList) {

      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'starting...', details: {
        asyncApiFile: asyncApiFile
      }}));

      const cliAppConfig: TCliAppConfig = {
        ...CliConfig.getCliAppConfig(),
        asyncApiFileName: asyncApiFile,
        apiTransactionId: CliUtils.getUUID(),
      };
      const importer = new CliImporter(cliAppConfig);
      const cliImporterRunReturn: ICliImporterRunReturn = await importer.run();  
      if(cliImporterRunReturn.applicationDomainName !== undefined) applicationDomainNameList.push(cliImporterRunReturn.applicationDomainName);
      if(cliImporterRunReturn.error !== undefined) throw cliImporterRunReturn.error;

      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'done.', details: {
        asyncApiFile: asyncApiFile,
      }}));

    }
    // if test mode then delete the application domains
    if(CliConfig.getCliAppConfig().importerMode === ECliImporterMode.TEST_MODE) {
      const xvoid: void = await deleteApplicationDomains({ applicationDomainNameList: applicationDomainNameList });
    }    
  } catch(e) {

    if(CliConfig.getCliAppConfig().importerMode === ECliImporterMode.TEST_MODE) {
      const xvoid: void = await deleteApplicationDomains({ applicationDomainNameList: applicationDomainNameList });
    } else {
      const xvoid: void = await rollback({ });
    }
  
    CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ERROR, details: {
      error: e
    }}));

    throw e;

  }

}

function initialize(commandLineOptionValues: OptionValues) {
  const funcName = 'initialize';
  const logName = `${ComponentName}.${funcName}()`;

  const filePattern = commandLineOptionValues.filePattern;

  CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING, message: 'gathering file list' , details: {
    filePattern: filePattern
  }}));

  const fileList = createApiSpecFileList(filePattern);

  if(fileList.length === 0) throw new CliUsageError(logName, 'no files found for pattern', {
    filePattern: filePattern,
  });
  
  CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING, message: 'file list', details: {
    fileList: fileList
  }}));

  CliConfig.initialize({
    fileList: fileList,
    globalDomainName: commandLineOptionValues.domain,
    apiGroupTransactionId: CliUtils.getUUID(),
  });
  CliLogger.initialize(CliConfig.getCliLoggerConfig());
  CliConfig.logConfig();
  EpSdkClient.initialize({
    token: CliConfig.getSolaceCloudToken(),
    baseUrl: CliConfig.getCliEpApiConfig().epApiBaseUrl
  });  

}

function getCommandLineOptionValues(): OptionValues {

  const Program = new Command();

  Program
  .name(`npx ${packageJson.name}`)
  .description(`${packageJson.description}`)
  .version(`${packageJson.version}`, '-v, --version')
  .usage('[OPTIONS]...')
  // .requiredOption('-f, --file <value>', 'Required: Path to AsyncAPI spec file')
  .requiredOption('-fp, --filePattern <value>', 'Required: File pattern for Async API files')
  .option('-d, --domain  <value>', 'Application Domain Name. If not passed, name extracted from info.x-sep-application-domain-name in api')
  .parse(process.argv);
  
  const ovs = Program.opts();

  return ovs;
}

clear();
console.log(chalk.red(figlet.textSync(packageJson.description, { horizontalLayout: 'full'})));
initialize(getCommandLineOptionValues());
main();