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
import { ApplicationDomain } from '@solace-iot-team/ep-sdk/sep-openapi-node';
import { EpSdkClient } from '@solace-iot-team/ep-sdk/EpSdkClient';
// import CliEPApplicationDomainsService from './services/CliEPApplicationDomainsService';
import EpSdkApplicationDomainsService from '@solace-iot-team/ep-sdk/services/EpSdkApplicationDomainsService';

dotenv.config();
const packageJson = require('../package.json');

const ComponentName: string = path.basename(__filename);

const createApiSpecFileList = (filePattern: string): Array<string> => {
  const files: Array<string> = glob.sync(filePattern);
  return files;
}

async function cleanup({ applicationDomainNameList }:{
  applicationDomainNameList: Array<string>;
}): Promise<void> {
  const funcName = 'cleanup';
  const logName = `${ComponentName}.${funcName}()`;

  // if test mode then delete the application domains
  if(CliConfig.getCliAppConfig().importerMode !== ECliImporterMode.TEST_MODE) return;

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

async function main() {
  const funcName = 'main';
  const logName = `${ComponentName}.${funcName}()`;

  CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'starting...', details: {
    cliAppConfig: CliConfig.getCliAppConfig()
  }}));

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
      };
      const importer = new CliImporter(cliAppConfig);
      const cliImporterRunReturn: ICliImporterRunReturn = await importer.run();  
      if(cliImporterRunReturn.applicationDomainName !== undefined) applicationDomainNameList.push(cliImporterRunReturn.applicationDomainName);
      if(cliImporterRunReturn.error !== undefined) throw cliImporterRunReturn.error;

      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'done.', details: {
        asyncApiFile: asyncApiFile,
      }}));

      const xvoid: void = await cleanup({ applicationDomainNameList: applicationDomainNameList });

    }
  } catch(e) {

    const xvoid: void = await cleanup({ applicationDomainNameList: applicationDomainNameList });

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
    globalDomainName: commandLineOptionValues.domain
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