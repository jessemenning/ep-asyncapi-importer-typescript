import s from 'shelljs';
import path from 'path';
import fs from 'fs';
import { Constants }  from './Constants';

const scriptName: string = path.basename(__filename);
const scriptDir: string = path.dirname(__filename);

const CONSTANTS = new Constants(scriptDir);

const checkVersion = () => {
  const funcName = 'checkVersion';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;

  const getNpmLatestVersion = (packageName: string): string => {
    const latestVersion = s.exec(`npm view ${packageName} version`).stdout.slice(0, -1);
    return latestVersion;
  }

  const checkVersion = (releaseDir: string) => {
    const funcName = 'checkVersion.checkVersion';
    const logName = `${scriptDir}/${scriptName}.${funcName}()`;
    console.log(`${logName}: starting ...`);
  
    const npmLatestVersion = getNpmLatestVersion(CONSTANTS.CliPacakgeName);
    const newVersion = CONSTANTS.CliPackageVersion;
    console.log(`${CONSTANTS.CliPacakgeName}: npm latest version='${npmLatestVersion}', new version='${newVersion}'`);
    if(newVersion === npmLatestVersion) {
        console.log(`${logName}: [${CONSTANTS.Skipping}]: nothing to do.`);
        process.exit(2);
    }
    // write new version into package.json
    const PackageJsonFile = `${releaseDir}/package.json`;
    const PackageJson = require(`${PackageJsonFile}`);
    PackageJson.version = newVersion;
    let newPackageJsonString = JSON.stringify(PackageJson, null, 2);
    s.cp(`${PackageJsonFile}`, `${releaseDir}/.package.json`);
    fs.writeFileSync(PackageJsonFile, newPackageJsonString);  
    console.log(`${logName}: success.`);
  }
  
  // func main
  console.log(`${logName}: starting ...`);
  checkVersion(CONSTANTS.WorkingCliDir);
  console.log(`${logName}: success.`);
}

const prepare = () => {
  const funcName = 'prepare';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;
  console.log(`${logName}: starting ...`);
  if(s.rm('-rf', CONSTANTS.WorkingCliPublishDir).code !== 0) process.exit(1);
  if(s.mkdir('-p', CONSTANTS.WorkingCliPublishDir).code !== 0) process.exit(1);
  console.log(`${logName}: success.`);
}

// const copyAssetsToWorkingPublishDir = () => {
//   const funcName = 'copyAssetsToWorkingPublishDir';
//   const logName = `${scriptDir}/${scriptName}.${funcName}()`;
//   console.log(`${logName}: starting ...`);

//   if(s.cd(`${CONSTANTS.WorkingCliDir}`).code !== 0) process.exit(1);

//   const cliPublishFromFilesMap = new Map<string, string>([
//     ["LICENSE", "."],
//     ["README.md", "."],
//     ["ReleaseNotes.md", "."],
//     ["package.json", "."],
//     ["dist/sep-async-api-importer*", "./bin"]
//   ]);

//   for(const [fromFile, toDir] of cliPublishFromFilesMap) {
//     const toFileDir = CONSTANTS.WorkingCliPublishDir + "/" + toDir;
//     // ensure toFileDir exists
//     if(s.mkdir('-p', toFileDir).code !== 0) process.exit(1);

//     // console.log(`${logName}: fromFile = ${fromFile}`);    
//     // console.log(`${logName}: toFileDir=${toFileDir}`);

//     if(s.cp('-rf', "./" + fromFile, toFileDir).code !== 0) process.exit(1);
//   }

//   console.log(`${logName}: success.`);
// }

const copyAssetsToWorkingPublishDir = () => {
  const funcName = 'copyAssetsToWorkingPublishDir';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;
  console.log(`${logName}: starting ...`);

  if(s.cp('-rf', `${CONSTANTS.WorkingCliDir}/*`, CONSTANTS.WorkingCliPublishDir).code !== 0) process.exit(1);

  console.log(`${logName}: success.`);
}

const publishPackage = () => {
  const funcName = 'publishPackage';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;
  console.log(`${logName}: starting ...`);

  const publish = (releaseDir: string) => {
    if(s.cd(`${releaseDir}`).code !== 0) process.exit(1);
    
    // for testing
    // if(s.exec('npm publish --dry-run').code !== 0) process.exit(1);  
    
    // for publishing
    if(s.exec('npm publish').code !== 0) process.exit(1);

  }

  publish(CONSTANTS.WorkingCliPublishDir);

  console.log(`${logName}: success.`);

}

const main = () => {
  const funcName = 'main';
  const logName = `${scriptDir}/${scriptName}.${funcName}()`;
  console.log(`${logName}: starting ...`);
  CONSTANTS.initAfterCopy();
  CONSTANTS.log();

  checkVersion();

  prepare();

  copyAssetsToWorkingPublishDir();

  publishPackage();

  console.log(`${logName}: success.`);
}

main();
