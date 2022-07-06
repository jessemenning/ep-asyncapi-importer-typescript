import path from 'path';

const ComponentName: string = path.basename(__filename);

function main() {
  const funcName = 'main';
  const logName = `${ComponentName}.${funcName}()`;

  // use pino logger
  console.log(`${logName}: starting ...`);

  // // Parse command line args
  // commander
  // .name(`npx ${packagejson.name}`)
  // .description(`${packagejson.description}`)
  // .version(`${packagejson.version}`, '-v, --version')
  // .usage('[OPTIONS]...')
  // .requiredOption('-f, --file <value>', 'Required: Path to AsyncAPI spec file')
  // .option('-d, --domain  <value>', 'Application Domain Name. If not passed, name extracted from x-domain-name in spec file')
  // .option('-dID, --domainID <value>', 'Application Domain ID. If not passed, ID extracted from x-domain-id in spec file')
  // .parse(process.argv);

  // const options = commander.opts()


}


main();