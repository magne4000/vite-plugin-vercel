import { compileFromFile } from 'json-schema-to-typescript'
import fetch from 'node-fetch';
import fs from "fs/promises";
import path from "path";
import * as os from "os";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const url = 'https://openapi.vercel.sh/vercel.json';
const jsonFilepath = path.join(os.tmpdir(), 'vercel.json');
const outFilepath = path.join(__dirname, 'vercel.ts');

const response = await fetch(url);
const body = await response.text();

await fs.writeFile(jsonFilepath, body, {
  encoding: 'utf-8'
});

// compile from file
const ts = await compileFromFile(jsonFilepath, {
  ignoreMinAndMaxItems: true
});


await fs.rm(outFilepath, {
  force: true,
})

await fs.writeFile(outFilepath, ts);

await fs.rm(jsonFilepath, {
  force: true,
})
