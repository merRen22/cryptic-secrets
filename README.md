# Secrets

A website that host static encrypted content that can only be opened using a key.

# Usage

The user scans a QR code that redirects him to a non index path in this site (with optional `?key=<uuid>` query param), he has to input a secret command to be able to read the content.

# Tech stack

- astro
- tailwind
- Web Crypto API (client-side AES-GCM encryption)
- Cloudflare Pages (hosting)

# Development Tools

- Prettier
- TypeScript

# Encryption

Encryption and decryption happens entirely client-side using the Web Crypto API with AES-GCM. Secrets are pre-encrypted before deployment and stored as static files.

# Content Management

Secrets are created and encrypted via a CLI tool, then deployed as static files to Cloudflare Pages.

# Commands

```bash
npm install
npm run dev
```

# Creating Secrets

```bash
node scripts/encrypt-secret.mjs path/to/secret.md
node scripts/encrypt-secret.mjs path/to/secret.md --uuid
```

- Prompts for encryption password (hidden input)
- Outputs to `src/pages/s/<unix-timestamp>.astro`
- Access the secret at `https://merren22.github.io/cryptic-secrets/s/<unix-timestamp>`
- With `--uuid`: UUID is generated and passed as query param `?key=<uuid>` in the URL, password format becomes `<password>-<uuid>` (UUID is shown in output)

# Samples:

https://merren22.github.io/cryptic-secrets/s/1777224385?key=40419773-9d3c-4f89-afe3-e8c54df87265 password abc
