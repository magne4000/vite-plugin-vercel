import { testFileNotExists } from '../helpers';

describe('prerender-manifest.json - pre tests', function () {
  testFileNotExists('.output/prerender-manifest.json');
});
