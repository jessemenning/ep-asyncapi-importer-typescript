import s from 'shelljs';
import path from 'path';

const scriptName: string = path.basename(__filename);
const scriptDir: string = path.dirname(__filename);

// files & dirs
import tsconfig from './tsconfig.json';
const outRoot = `${scriptDir}/dist`;
const outDir = tsconfig.compilerOptions.outDir;
const packageJsonFile = `${scriptDir}/package.json`;

const prepare = () => {
  const funcName = 'prepare';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;
  console.log(`${logName}: cleaning ${outRoot} ...`);
  if(s.rm('-rf', outRoot).code !== 0) process.exit(1);
  if(s.mkdir('-p', outDir).code !== 0) process.exit(1);
  console.log(`${logName}: success.`);
}

const compile = () => {
  const funcName = 'compile';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;
  console.log(`${logName}: compiling ...`);
  if(s.exec(`npm run compile`).code !== 0) process.exit(1);
  console.log(`${logName}: success.`);
}

const copyAssets = () => {
  const funcName = 'copyAssets';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;
  console.log(`${logName}: copying assets ...`);

  if(s.cp(`${packageJsonFile}`, `${outDir}`).code !== 0) process.exit(1);

  console.log(`${logName}: success.`);
}

const main = () => {
  const funcName = 'main';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;
  prepare();
  compile();
  copyAssets();
}

main();
