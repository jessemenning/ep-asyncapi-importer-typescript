import s from 'shelljs';
import path from 'path';
import { Constants } from './Constants';

const scriptName: string = path.basename(__filename);
const scriptDir: string = path.dirname(__filename);

const CONSTANTS = new Constants(scriptDir);

const prepare = () => {
  const funcName = 'prepare';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;
  console.log(`${logName}: starting ...`);
  if(s.rm('-rf', CONSTANTS.WorkingDir).code !== 0) process.exit(1);
  if(s.mkdir('-p', CONSTANTS.WorkingDir).code !== 0) process.exit(1);
  console.log(`${logName}: success.`);
}

const copySourcesToWorkingDir = () => {
  const funcName = 'copySourcesToWorkingDir';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;
  console.log(`${logName}: starting ...`);

  console.log(`${logName}: copying cli sources to working dir ...`);
  if(s.cp('-rf', CONSTANTS.CliDir, CONSTANTS.WorkingDir).code !== 0) process.exit(1);

  console.log(`${logName}: copying resources to working dir ...`);
  if(s.cp('-rf', CONSTANTS.ResourcesDir, CONSTANTS.WorkingDir).code !== 0) process.exit(1);

  // remove generated
  if(s.rm('-rf', `${CONSTANTS.WorkingCliDir}/_generated`).code !== 0) process.exit(1);

  console.log(`${logName}: success.`);
}

const buildAndPackageCli = () => {
  const funcName = 'buildAndPackageCli';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;
  console.log(`${logName}: starting ...`);

  if(s.cd(`${CONSTANTS.WorkingCliDir}`).code !== 0) process.exit(1);

  console.log(`${logName}: node --version:`);
  if(s.exec('node --version').code !== 0) process.exit(1);

  console.log(`${logName}: npm version:`);
  if(s.exec('npm --version').code !== 0) process.exit(1);

  if(s.exec('npm install').code !== 0) process.exit(1);

  console.log(`${logName}: npx tsc --version:`);
  if(s.exec('npx tsc --version').code !== 0) process.exit(1);
  
  console.log(`${logName}: npm list for dev:`);
  if(s.exec('npm list').code !== 0) process.exit(1);

  if(s.exec('npm run dev:build').code !== 0) process.exit(1);

  // build
  if(s.exec('npm run build').code !== 0) process.exit(1);

  // // package
  // if(s.exec('npm run package').code !== 0) process.exit(1);

  if(s.rm('-rf', `${CONSTANTS.WorkingCliDir}/node_modules`).code !== 0) process.exit(1);
  if(s.exec('export NODE_ENV=production; npm ci --only=production').code !== 0) process.exit(1);
  // if(s.exec('npm prune --production --json').code !== 0) process.exit(1);
  console.log(`${logName}: npm list for production:`);
  if(s.exec('npm list --prod').code !== 0) process.exit(1);

  console.log(`${logName}: success.`);
}

const main = () => {
  const funcName = 'main';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;
  console.log(`${logName}: starting ...`);

  prepare();
  copySourcesToWorkingDir();
  CONSTANTS.initAfterCopy();
  CONSTANTS.log();
  buildAndPackageCli();

  console.log(`${logName}: success.`);
}

main();
