# Warexo ERP System – API Playground

This repository is a small IntelliJ / PhpStorm HTTP Client example project for the **Warexo ERP System API**. It contains ready-to-run HTTP request files and an environment setup to safely experiment with the API on your local machine.

## Contents

- `authentication.http` – Example authentication and login requests.
- `entities.http` – Requests for core entities (for example customers, items, documents).
- `search.http` – Search, filter, and listing examples.
- `http-client.env.json` – Template environment file (tracked, contains non-secret placeholders).
- `http-client.private.env.json` – Local environment file for secrets (ignored by Git).

## Prerequisites

- IntelliJ IDEA or PhpStorm with the built-in HTTP Client
- Access credentials for the Warexo ERP System API
- Git (optional, for cloning and version control)

## http-client.env.json

The file `http-client.env.json` is a **template** for your HTTP Client environments. It is checked into version control and should only contain placeholder or non-sensitive values.

Example content:

```json
{
  "dev": {
    "app_url": "",
    "client_id": "",
    "username": "",
    "password": ""
  }
}
```

### Fields

- `dev`  
  The name of the environment. You can add more environments (e.g. `stage`, `prod`) as additional top-level objects.

- `app_url`  
  Base URL of the Warexo ERP API instance you want to call. Include the scheme (`https://`).  
  Example: `https://warexo-dev.example.com`.

- `client_id`
  *(currently unused, enter warexo)*
  Client identifier for the API (for example OAuth client ID or application ID) used by authentication flows that require a client credential.

- `username`  
  Warexo Username

- `password`  
  Password for the `username`. This is **sensitive** and must **not** be stored in the tracked `http-client.env.json` file when you use real credentials.

In this repository, `http-client.env.json` is intended as a template only. Put real values into `http-client.private.env.json`.

## Creating http-client.private.env.json

To work with real data you create a private copy of the template and fill in your own values.

1. **Create the private file from the template**

   In the project root, copy the template:

   ```bash
   cp http-client.env.json http-client.private.env.json
   ```

2. **Edit the private environment**

   Open `http-client.private.env.json` in your editor or IDE and replace the empty strings / placeholders:

   - Set `app_url` to the actual Warexo ERP API base URL.
   - Set `client_id` to the real client ID (if required).
   - Set `username` and `password` to credentials that are valid for your test or development environment.
   - Add additional fields if needed (for example `client_secret`, `token_url`, `warehouse_id`, …) and reference them in the `.http` files via `{{variable_name}}`.

3. **Git ignore behavior**

   The file `http-client.private.env.json` is already listed in `.gitignore` and is **not** committed to the repository. Do not force-add it.

   If it was accidentally committed in the past, remove it from the Git index:

   ```bash
   git rm --cached http-client.private.env.json
   git commit -m "Remove private HTTP client env file from repo"
   ```

## Using the HTTP Client

1. Open one of the HTTP files in IntelliJ IDEA or PhpStorm:
   - `authentication.http`
   - `entities.http`
   - `search.http`

2. Select the environment that corresponds to your configuration (for example `dev` in `http-client.private.env.json`).

3. Click the **Run** icon next to a request to execute it.

4. Inspect the response in the built-in HTTP Client response panel (status code, headers, body).

## Typical workflow

1. Copy `http-client.env.json` to `http-client.private.env.json` (once per developer / machine).
2. Fill in real values for your development or test environment in the private file.
3. Start with `authentication.http` to verify that authentication and tokens work. Login method will store tokens for subsequent requests.
4. Use `entities.http` and `search.http` to read, create, update, or search data in your Warexo ERP instance.

## Security notes

- Keep **real** credentials and tokens only in `http-client.private.env.json` on your local machine.
- Do **not** store secrets in `http-client.env.json` or any other tracked file.
- Do not share `http-client.private.env.json` via Git, email, or chat.
- Rotate API keys, passwords, and tokens according to your organization’s security policies.

## Support

This repository is an internal playground for the Warexo ERP System API. For questions about endpoints, authentication, or available data, refer to the internal API documentation or contact the Warexo backend / DevOps team.
