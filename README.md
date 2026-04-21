# Secrets

A website that host static encrypted content that can only be opened using a key.

# Usage

The user scans a QR code that redirects him to a non index path in this site, he has to input a secret command to be able to read the content.

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
node scripts/encrypt-secret.mjs path/to/secret.md [slug]
```

- Prompts for encryption password (hidden input)
- Outputs to `src/pages/s/<slug>.astro` (slug defaults to unix timestamp)
- Access the secret at `/s/<slug>` in the dev server or after deployment
