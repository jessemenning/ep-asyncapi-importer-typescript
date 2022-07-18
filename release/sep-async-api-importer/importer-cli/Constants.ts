
const ENV_VAR_APIM_RELEASE_ALPHA_VERSION = "APIM_RELEASE_ALPHA_VERSION";

export class Constants {
  private readonly _scriptDir: string;
  private readonly _gitRoot: string;
  private readonly _workingDir: string;
  private readonly _cliDir: string;
  private readonly _resourcesDir: string;
  private readonly _workingCliDir: string;
  private readonly _skipping: string;
  private _cliPackageName: string;
  private _cliPackageVersion: string;
  private _workingCliPublishDir: string;
  // private _alphaVersion: string | undefined; 

  constructor(scriptDir: string) {
    this._scriptDir = scriptDir;
    this._gitRoot = `${scriptDir}/../../..`;
    this._workingDir = `${scriptDir}/working_dir`;
    this._cliDir = `${this._gitRoot}/importer-cli`;
    this._resourcesDir = `${this._gitRoot}/resources`;
    this._workingCliDir = `${this._workingDir}/importer-cli`;
    this._workingCliPublishDir = `${this._workingCliDir}-publish`;
    this._skipping = '+++ SKIPPING +++';
    this._cliPackageName = "not-initialized";
    this._cliPackageVersion = "not-initialized";
    // this._alphaVersion = process.env[ENV_VAR_APIM_RELEASE_ALPHA_VERSION];
  }

  // private createDockerImageTag = (version: string): string => {
  //   if(this._alphaVersion) {
  //     return `${version}-${this._alphaVersion.replaceAll('+', '-')}`;
  //   }
  //   return version;
  // }  
  // private createLatestTag = (): string => {
  //   if(this._alphaVersion) return 'alpha-latest';
  //   return 'latest';
  // }  
  public initAfterCopy() {
    const cliPackageJson = require(`${this._workingCliDir}/package.json`);
    this._cliPackageName = cliPackageJson.name;
    this._cliPackageVersion = cliPackageJson.version;
  }
  public log() {
    console.log(`${Constants.name} = ${JSON.stringify(this, null, 2)}`);
  }
  public get ScriptDir() { return this._scriptDir; }
  public get GitRoot() { return this._gitRoot; }
  public get WorkingDir() { return this._workingDir; }
  public get CliDir() { return this._cliDir; }
  public get ResourcesDir() { return this._resourcesDir; }
  public get WorkingCliDir() { return this._workingCliDir; }
  public get Skipping() { return this._skipping; }
  public get CliPackageVersion() { return this._cliPackageVersion; }
  public get CliPacakgeName() { return this._cliPackageName; }
  public get WorkingCliPublishDir() { return this._workingCliPublishDir; }
  // public get AlphaVersion() { return this._alphaVersion; }

}

