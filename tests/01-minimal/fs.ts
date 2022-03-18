import { testFileExists } from '../helpers';

describe('minimal - fs', function () {
  testFileExists('.output/server/pages/api/post.js');
});
