#!/usr/bin/env node

import chalk from 'chalk';
import clear from 'clear';
import figlet from 'figlet';
import path from 'path';
import CliConfig from './CliConfig';
import { CliLogger, ECliStatusCodes } from './CliLogger';
import dotenv from 'dotenv';
import { CliImporter } from './CliImporter';
import { EPClient } from './EPClient';
import { Command, OptionValues } from 'commander';

dotenv.config();
const packageJson = require('../package.json');

const ComponentName: string = path.basename(__filename);

async function main() {
  const funcName = 'main';
  const logName = `${ComponentName}.${funcName}()`;

  CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, details: "starting ..." }));

  const importer = new CliImporter(CliConfig.getCliAppConfig());
  
  await importer.run();

  CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, details: "done." }));

}

function initialize(commandLineOptionValues: OptionValues) {
  CliConfig.initialize({
    filePattern: commandLineOptionValues.file,
    globalDomainName: commandLineOptionValues.domain
  });
  CliLogger.initialize(CliConfig.getCliLoggerConfig());
  CliConfig.logConfig();
  EPClient.initialize(CliConfig.getSolaceCloudToken());
}

function getCommandLineOptionValues(): OptionValues {
  const Program = new Command();

  Program
  .name(`npx ${packageJson.name}`)
  .description(`${packageJson.description}`)
  .version(`${packageJson.version}`, '-v, --version')
  .usage('[OPTIONS]...')
  .requiredOption('-f, --file <value>', 'Required: Path to AsyncAPI spec file')
  .option('-d, --domain  <value>', 'Application Domain Name. If not passed, name extracted from x-domain-name in spec file')
  .parse(process.argv);
    
  return Program.opts();
}

clear();
console.log(chalk.red(figlet.textSync(packageJson.description, { horizontalLayout: 'full'})));
initialize(getCommandLineOptionValues());
main();