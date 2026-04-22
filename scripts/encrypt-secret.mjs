#!/usr/bin/env node

import { webcrypto } from 'node:crypto';
import fs from 'node:fs';
import readline from 'node:readline';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

if (process.argv.length < 3) {
  console.error('Usage: node encrypt-secret.mjs <input.md> [slug]');
  process.exit(1);
}

const inputFile = process.argv[2];
const slug = process.argv[3] || String(Date.now());

if (!fs.existsSync(inputFile)) {
  console.error(`Error: File '${inputFile}' not found`);
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const password = await new Promise(resolve => {
  rl.question('Enter encryption password: ', resolve);
  process.stdin.setRawMode?.(false);
});
rl.close();

if (!password) {
  console.error('Error: Password cannot be empty');
  process.exit(1);
}

const content = fs.readFileSync(inputFile, 'utf-8');
const passwordBase64 = Buffer.from(password, 'utf-8').toString('base64');

const salt = webcrypto.getRandomValues(new Uint8Array(SALT_LENGTH));
const iv = webcrypto.getRandomValues(new Uint8Array(IV_LENGTH));

const passwordBuffer = new TextEncoder().encode(passwordBase64);
const keyMaterial = await webcrypto.subtle.importKey(
  'raw',
  passwordBuffer,
  'PBKDF2',
  false,
  ['deriveBits']
);

const keyBits = await webcrypto.subtle.deriveBits(
  { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
  keyMaterial,
  KEY_LENGTH
);

const key = await webcrypto.subtle.importKey(
  'raw',
  keyBits,
  { name: ALGORITHM, length: KEY_LENGTH },
  false,
  ['encrypt']
);

const encrypted = await webcrypto.subtle.encrypt(
  { name: ALGORITHM, iv },
  key,
  new TextEncoder().encode(content)
);

const combined = new Uint8Array([...new Uint8Array(encrypted), ...salt, ...iv]);

const outputDir = 'src/pages/s';
fs.mkdirSync(outputDir, { recursive: true });
const outputFile = `${outputDir}/${slug}.astro`;

const saltB64 = Buffer.from(salt).toString('base64');
const ivB64 = Buffer.from(iv).toString('base64');
const ciphertextB64 = Buffer.from(combined).toString('base64');

const pageContent = `---
import '../../styles/global.css';
import BaseLayoutComponent from '../../layouts/BaseLayout.astro';
---

<BaseLayoutComponent
  title="Secret"
  data="${ciphertextB64}"
  iterations={${ITERATIONS}}
>
  <div class="container">
    <div id="locked">
      <h1>Enter Password</h1>
      <input type="password" id="key" placeholder="Password" autocomplete="off" />
      <button id="decrypt">Decrypt</button>
      <p id="error">Incorrect password</p>
    </div>
    <pre id="content"></pre>
  </div>
</BaseLayoutComponent>`;

fs.writeFileSync(outputFile, pageContent);
console.log(`Created: ${outputFile}`);
