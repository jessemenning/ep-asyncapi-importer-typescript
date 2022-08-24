#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import path from 'path';
import dotenv from 'dotenv';
import { glob } from 'glob';
import { Command, Option, OptionValues } from 'commander';
import { CliError, CliErrorFactory, CliErrorFromError, CliUsageError } from './CliError';
import { OpenAPI } from '@solace-labs/ep-openapi-node';
import { EpSdkClient } from '@solace-labs/ep-sdk';
import { CliUtils } from './CliUtils';
import CliConfig, { TCliConfigEnvVarConfig } from './CliConfig';
import { CliLogger, ECliStatusCodes } from './CliLogger';
import { DefaultAppName, packageJson } from './consts';
import { CliImporter } from './CliImporter';
import CliRunSummary, { ECliRunSummary_Type } from './CliRunSummary';

const ComponentName: string = path.basename(__filename);
dotenv.config();

process.on('uncaughtException', (err: Error) => {
  const funcName = "process.on('uncaughtException')";
  const logName = `${ComponentName}.${funcName}()`;
  const cliError: CliError = CliErrorFactory.createCliError({
    logName: logName,
    e: err
  });
  if(!(err instanceof CliError)) {
    const cliLogEntry = CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INTERNAL_ERROR, details: cliError.toObject()});
    CliLogger.fatal(cliLogEntry);
  }
  CliRunSummary.runError({
    cliRunError: {
      type: ECliRunSummary_Type.RunError,
      cliError: cliError
    }
  });
  process.exit(1);
});

// const createApiFileList = (filePattern: string): Array<string> => {
//   const funcName = 'createApiFileList';
//   const logName = `${ComponentName}.${funcName}()`;
//   const fileList: Array<string> = glob.sync(filePattern);
//   if(fileList.length === 0) throw new CliUsageError(logName, 'no files found for pattern', {
//     filePattern: filePattern,
//   });
//   for(const filePath of fileList) {
//     const x: string | undefined = CliUtils.validateFilePathWithReadPermission(filePath);
//     if(x === undefined) throw new CliUsageError(logName, 'file does not have read permissions', {
//       file: filePath,
//     });
//   }
//   return fileList;
// }

async function main() {
  const funcName = 'main';
  const logName = `${ComponentName}.${funcName}()`;

  CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'starting...', details: {
    cliConfig: CliConfig.getCliConfig()
  }}));

  const cliImporter = new CliImporter(CliConfig.getCliImporterOptions());
  const xvoid: void = await cliImporter.run();
}

function initialize(commandLineOptionValues: OptionValues) {
  const funcName = 'initialize';
  const logName = `${ComponentName}.${funcName}()`;

  // initialize with default values so we can log until initialized
  CliLogger.initialize({
    cliLoggerOptions: CliConfig.getDefaultLoggerOptions()
  });

  const filePattern = commandLineOptionValues.filePattern;
  const fileList = CliUtils.createFileList(filePattern);
  CliConfig.initialize({
    fileList: fileList,
    applicationDomainName: commandLineOptionValues.domain,
    defaultAppName: DefaultAppName
  });
  CliLogger.initialize({ cliLoggerOptions: CliConfig.getCliLoggerOptions() });
  CliConfig.logConfig();
  EpSdkClient.initialize({
    globalOpenAPI: OpenAPI,
    token: CliConfig.getSolaceCloudToken(),
    baseUrl: CliConfig.getEpApiBaseUrl()
  });  
}

function getCliConfigEnvVarHelp(): string {
  const cliConfigEnvVarConfigList: Array<TCliConfigEnvVarConfig> = CliConfig.get_CliConfigEnvVarConfigList4HelpDisplay();
  return `
Environment Variables:
  Set env vars, use .env file, or a combination of both.
${JSON.stringify(cliConfigEnvVarConfigList, null, 2)}    
`;
}

function getCommandLineOptionValues(): OptionValues {

  const Program = new Command();

  const domainOption: Option = Program.createOption('-d, --domain <value>', 'Application Domain Name. Overrides the application domain name extracted from each in Async API file, path=$.info.x-ep-application-domain-name.');
  domainOption.hideHelp(true);
  Program
  .name(`npx ${packageJson.name}`)
  // .description(`${packageJson.description}`)
  .version(`${packageJson.version}`, '-v, --version')
  .usage('[Options]...')
  .requiredOption('-fp, --filePattern <value>', 'Required: File pattern for Async API file(s).')
  .addOption(domainOption)
  .addHelpText('after', getCliConfigEnvVarHelp())
  .parse(process.argv);
  
  const ovs = Program.opts();

  return ovs;
}

CliConfig.validate_CliConfigEnvVarConfigList();
clear();
console.log(chalk.red(figlet.textSync(packageJson.description, { horizontalLayout: 'full'})));
initialize(getCommandLineOptionValues());
main();