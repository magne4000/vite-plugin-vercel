import path from 'path';
import { teardown } from '../teardown';

const globalTeardown = teardown(path.basename(__dirname));
export default globalTeardown;
