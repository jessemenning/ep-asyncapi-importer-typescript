import 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import path from 'path';
// import _ from 'lodash';
import { TestContext, TestLogger, TTestEnv } from '../lib/test.helpers';
// import * as __index from '../../src/index';
import CliConfig from '../../src/CliConfig';
import { CliImporter } from '../../src/CliImporter';

const scriptName: string = path.basename(__filename);
TestLogger.logMessage(scriptName, ">>> starting ...");

// const ReferenceOrg_1 = 'org_1';
// const ReferenceOrg_2 = 'org_2';
// const ReferenceOrg_Updated = 'updated_org';
// const ReferenceOrg_Replaced = 'replaced_org';
// const numberOfUsers: number = 50;
// const apsUserCreateTemplate: APSUserCreate = {
//   isActivated: true,
//   userId: 'userId',
//   password: 'password',
//   profile: {
//     email: 'email@aps.test',
//     first: 'first',
//     last: 'last'
//   },
//   systemRoles: [EAPSSystemAuthRole.SYSTEM_ADMIN],
//   memberOfOrganizations: [
//     { 
//       organizationId: ReferenceOrg_1,
//       roles: [EAPSOrganizationAuthRole.ORGANIZATION_ADMIN]
//     }
//   ],
//   memberOfOrganizationGroups: [],
// }
// const apsUserCreateTemplate2: APSUserCreate = {
//   isActivated: true,
//   userId: 'userId2',
//   password: 'password2',
//   profile: {
//     email: 'email2@aps.test',
//     first: 'first2',
//     last: 'last2'
//   },
//   memberOfOrganizations: [
//     { 
//       organizationId: ReferenceOrg_2,
//       roles: [EAPSOrganizationAuthRole.ORGANIZATION_ADMIN]
//     }
//   ],
//   memberOfOrganizationGroups: [],
// }

// process.argv = ['node', 'jest', '--arg1', '1', '--arg2', 'hello']

describe(`${scriptName}`, () => {
    
    beforeEach(() => {
      TestContext.newItId();
    });

    // it(`${scriptName}: hello world`, async () => {
    //   throw new Error('continue here')
    // });


    it(`${scriptName}: initialize cli`, async () => {



      // const testEnv: TTestEnv = TestContext.getTestEnv();
      
      // const args=[
      //   "-f",
      //   "../data/acme-retail/central-it/till-system/AcmeRetail-Central-IT-Provider-TillSystem-v1.spec.yml",
      //   "-d",
      //   "`sep-async-api-importer/test/timestamp`"
      // ];

      // __index.start_up([]);

      // set the config stuff
      // CliConfig.


      // just set the config and run it?

      console.log('hello world')


      const importer = new CliImporter(CliConfig.getCliAppConfig());
      await importer.run();

      expect(false, TestLogger.createTestFailMessage('continue here')).to.be.true;


      // process.argv.push(...args);

      // const options = __index.cmdLineOptions(args);


      // __index.initialize({ 
      //   filePattern: `${testEnv.projectRootDir}/data/acme-retail/central-it/till-system/AcmeRetail-Central-IT-Provider-TillSystem-v1-Test.spec.yml`,
      //   domain: `sep-async-api-importer/test/timestamp`
      // });

      // __index.main();

    });

    // it(`${scriptName}: should list users with paging`, async () => {
    //   let apsUserList: APSUserResponseList = [];
    //   let receivedTotalCount: number = 0;
    //   let reportedTotalCount: number;
    //   try {
    //     const pageSize = 2;
    //     let pageNumber = 1;
    //     let hasNextPage = true;
    //     while (hasNextPage) {
    //       const resultListApsUsers: ListApsUsersResponse  = await ApsUsersService.listApsUsers({
    //         pageSize: pageSize, 
    //         pageNumber: pageNumber
    //       });
    //       if(resultListApsUsers.list.length === 0 || resultListApsUsers.list.length < pageSize) hasNextPage = false;
    //       pageNumber++;
    //       apsUserList.push(...resultListApsUsers.list);
    //       receivedTotalCount += resultListApsUsers.list.length;
    //       reportedTotalCount = resultListApsUsers.meta.totalCount;
    //     }
    //   } catch (e) {
    //     expect(e instanceof ApiError, `${TestLogger.createNotApiErrorMesssage(e.message)}`).to.be.true;
    //     let message = `ApsUsersService.deleteApsUser()`;
    //     expect(false, `${TestLogger.createTestFailMessage(message)}`).to.be.true;
    //   }
    //   expect(receivedTotalCount, 'number of objects received not the same as reported totalCount').equal(reportedTotalCount);
    // });


});

