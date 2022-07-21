#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import path from 'path';
import CliConfig, { ECliImporterMode, TCliAppConfig } from './CliConfig';
import { CliLogger, ECliStatusCodes } from './CliLogger';
import dotenv from 'dotenv';
import { CliImporter, ICliImporterRunReturn } from './CliImporter';
import { EPClient } from './EPClient';
import { Command, OptionValues } from 'commander';
import { glob } from 'glob';
import { CliUsageError } from './CliError';
import CliEPApplicationDomainsService from './services/CliEPApplicationDomainsService';
import { ApplicationDomain } from './_generated/@solace-iot-team/sep-openapi-node';

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
      const applicationDomain: ApplicationDomain = await CliEPApplicationDomainsService.deleteByName( { 
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
    for(const asyncApiSpecFile of CliConfig.getCliAppConfig().asyncApiSpecFileList) {

      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'starting...', details: {
        asyncApiSpecFile: asyncApiSpecFile
      }}));

      const cliAppConfig: TCliAppConfig = {
        ...CliConfig.getCliAppConfig(),
        asyncApiSpecFileName: asyncApiSpecFile,
      };
      const importer = new CliImporter(cliAppConfig);
      const cliImporterRunReturn: ICliImporterRunReturn = await importer.run();  
      if(cliImporterRunReturn.applicationDomainName !== undefined) applicationDomainNameList.push(cliImporterRunReturn.applicationDomainName);
      if(cliImporterRunReturn.error !== undefined) throw cliImporterRunReturn.error;

      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'done.', details: {
        asyncApiSpecFile: asyncApiSpecFile,
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
  EPClient.initialize({
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
  .requiredOption('-fp, --filePattern <value>', 'Required: File pattern for AsyncAPI spec files')
  .option('-d, --domain  <value>', 'Application Domain Name. If not passed, name extracted from x-domain-name in spec file')
  .parse(process.argv);
    
  return Program.opts();
}

clear();
console.log(chalk.red(figlet.textSync(packageJson.description, { horizontalLayout: 'full'})));
initialize(getCommandLineOptionValues());
main();