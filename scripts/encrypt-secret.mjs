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

const pageContent = `<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Secret</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: ui-sans-serif, system-ui, sans-serif;
        padding: 2rem;
        background: #fff;
      }
      .container { max-width: 800px; width: 100%; }
      #locked {
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
      }
      #locked h1 { font-size: 1.5rem; margin-bottom: 1rem; }
      input[type="password"] {
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        margin-bottom: 1rem;
      }
      button {
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        background: #000;
        color: #fff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
      button:hover { background: #333; }
      #error { color: #dc2626; margin-top: 1rem; display: none; }
      #content {
        white-space: pre-wrap;
        font-family: ui-monospace, monospace;
        line-height: 1.6;
        display: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div id="locked">
        <h1>Enter Password</h1>
        <input type="password" id="key" placeholder="Password" autocomplete="off" />
        <button id="decrypt">Decrypt</button>
        <p id="error">Incorrect password</p>
      </div>
      <pre id="content"></pre>
    </div>
    <script>
      const DATA = "${ciphertextB64}";
      const ITERATIONS = ${ITERATIONS};

      const input = document.getElementById("key");
      const button = document.getElementById("decrypt");
      const error = document.getElementById("error");
      const locked = document.getElementById("locked");
      const content = document.getElementById("content");

      async function strToBuf(str) {
        return new TextEncoder().encode(str);
      }

      async function base64ToBuf(str) {
        return Uint8Array.from(atob(str), c => c.charCodeAt(0));
      }

      async function deriveKey(password) {
        const combined = await base64ToBuf(DATA);
        const salt = combined.slice(-28, -12);
        const passwordBase64 = btoa(password);
        const keyMaterial = await crypto.subtle.importKey(
          "raw", await strToBuf(passwordBase64), "PBKDF2", false, ["deriveKey"]
        );
        return crypto.subtle.deriveKey(
          { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
          keyMaterial,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );
      }

      async function decrypt(password) {
        const combined = await base64ToBuf(DATA);
        const ciphertext = combined.slice(0, -28);
        const iv = combined.slice(-12);
        const key = await deriveKey(password);
        const plaintext = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          key,
          ciphertext
        );
        return new TextDecoder().decode(plaintext);
      }

      async function handleDecrypt() {
        const password = input.value;
        try {
          const text = await decrypt(password);
          locked.style.display = "none";
          content.style.display = "block";
          content.textContent = text;
        } catch {
          error.style.display = "block";
        }
      }

      button.addEventListener("click", handleDecrypt);
      input.addEventListener("keypress", e => { if (e.key === "Enter") handleDecrypt(); });
    </script>
  </body>
</html>`;

fs.writeFileSync(outputFile, pageContent);
console.log(`Created: ${outputFile}`);
