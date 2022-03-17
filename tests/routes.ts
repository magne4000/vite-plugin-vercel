import fs from 'fs/promises';
import type { RoutesManifest } from 'vite-plugin-vercel';

describe('routes-manifest.json - pre tests', function () {
  it('should exist in .output/routes-manifest.json', async function () {
    const stats = await fs.stat('.output/routes-manifest.json');

    expect(stats.isFile()).toBe(true);
  });

  it('should be JSON format', async function () {
    const manifest = await fs.readFile('.output/routes-manifest.json', {
      encoding: 'utf-8',
    });

    expect(JSON.parse(manifest)).toMatchObject({});
  });
});

describe('routes-manifest.json', function () {
  let manifest: RoutesManifest;

  beforeAll(async () => {
    manifest = JSON.parse(
      await fs.readFile('.output/routes-manifest.json', {
        encoding: 'utf-8',
      }),
    );
  });

  it('should be at version 3', function () {
    expect(manifest).toHaveProperty('version', 3);
  });

  it('should have a basePath string value', function () {
    expect(manifest).toHaveProperty('basePath');
    expect(typeof manifest.basePath).toBe('string');
  });

  it('should have a pages404 boolean value', function () {
    expect(manifest).toHaveProperty('pages404');
    expect(typeof manifest.pages404).toBe('boolean');
  });

  it('should not have unknow properties', function () {});
});
