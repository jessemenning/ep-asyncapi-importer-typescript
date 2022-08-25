#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import path from 'path';
import dotenv from 'dotenv';
import { Command, Option, OptionValues } from 'commander';
import { CliError, CliErrorFactory } from './CliError';
import { OpenAPI } from '@solace-labs/ep-openapi-node';
import { EpSdkClient } from '@solace-labs/ep-sdk';
import { CliUtils } from './CliUtils';
import CliConfig, { TCliConfigEnvVarConfig } from './CliConfig';
import { CliLogger, ECliStatusCodes } from './CliLogger';
import { DefaultAppName, packageJson } from './consts';
import CliRunSummary, { ECliRunSummary_Type } from './CliRunSummary';
import { CliImporterManager } from './CliImporterManager';

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

async function main() {
  const funcName = 'main';
  const logName = `${ComponentName}.${funcName}()`;

  CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'starting...', details: {
    cliConfig: CliConfig.getCliConfig()
  }}));

  const cliImporter = new CliImporterManager(CliConfig.getCliImporterManagerOptions());
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

  const domainOption: Option = Program.createOption('-d, --domain <value>', 'Application Domain Name. Overrides the application domain name extracted from each in Async API file, path=$.x-ep-application-domain-name.');
  // domainOption.hideHelp(true);
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