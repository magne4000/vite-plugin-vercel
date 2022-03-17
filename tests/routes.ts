import fs from 'fs/promises';
import { routesManifestSchema } from 'vite-plugin-vercel/src/schemas/manifests/routes';
import myzod from 'myzod';

// TODO create tests scenarios
// 1. execute scenario that generates .output
// 2. execute all tests related to this scenario
// 3. if successful, execute next scenario

describe('routes-manifest.json - pre tests', function () {
  it('should exist in .output/routes-manifest.json', async function () {
    const stats = await fs.stat('.output/routes-manifest.json');

    expect(stats.isFile()).toBe(true);
  });

  it('should respect schema', async function () {
    const manifest = await fs.readFile('.output/routes-manifest.json', {
      encoding: 'utf-8',
    });

    expect(routesManifestSchema.try(JSON.parse(manifest))).not.toBeInstanceOf(
      myzod.ValidationError,
    );
  });
});
