const fs = require('fs');
const path = require('path');

function getProject(folder) {
  let globalSetup = undefined;
  let globalTeardown = undefined;

  try {
    fs.statSync(path.join(__dirname, `./tests/${folder}/setup.ts`));
    globalSetup = `./tests/${folder}/setup.ts`;
  } catch (e) {}

  try {
    fs.statSync(path.join(__dirname, `./tests/${folder}/teardown.ts`));
    globalTeardown = `./tests/${folder}/teardown.ts`;
  } catch (e) {}

  return {
    transform: {
      '^.+\\.(t|j)sx?$': '@swc/jest',
    },
    testEnvironment: 'node',
    globalSetup,
    globalTeardown,
    displayName: folder,
    setupFilesAfterEnv: ['jest-extended/all'],
    testMatch: [`<rootDir>/tests/${folder}/*.test.[jt]s?(x)`],
  };
}

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  projects: [
    getProject('01-minimal'),
    getProject('02-additional-endpoints'),
    getProject('03-prerender'),
    getProject('04-isr'),
    getProject('05-vite-plugin-ssr'),
  ],
};
