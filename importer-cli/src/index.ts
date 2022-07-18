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

function initialize() {
  CliConfig.initialize(packageJson);
  CliLogger.initialize(CliConfig.getCliLoggerConfig());
  CliConfig.logConfig();
  EPClient.initialize(CliConfig.getSolaceCloudToken());
}

clear();
console.log(chalk.red(figlet.textSync(packageJson.description, { horizontalLayout: 'full'})));
initialize();
main();