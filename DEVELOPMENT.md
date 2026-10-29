# Development and Hosting

This guide covers maintaining and publishing the testbed. For sample features and walkthroughs, see the [README](README.md).

## Local development

Use Node.js 22 or newer:

```sh
npm ci
npm start
```

The server listens only on localhost, disables caching, and opens <http://localhost:8080/embedded-sample-2026.html>. No hosts-file entry is required. To use another port, run `npm start -- -p 8081`.

Startup runs `npm run prepare:site`, which copies only [embedded-sample-2026.html](embedded-sample-2026.html) and its `index.html` alias into `_site/`. This generated directory is the document root for both local preview and Pages. Repository metadata, dependencies, tests, and certificates are not included.

After editing the source HTML, run `npm run prepare:site` and refresh the browser, or restart `npm start`. The staging command replaces `_site/`; never store source files or certificates there. There is no bundler or compiler.

Do not serve the repository root. The static server's dotfile option does not block all direct requests to hidden files; the isolated staging directory is the security boundary. Node serves static files only and does not proxy Five9 traffic or store credentials.

## Trusted local HTTPS

HTTP localhost is treated as a trustworthy origin by modern browsers, but that does not guarantee every embedded softphone, SSO, or CRM workflow will work over HTTP. Validate the actual browser and tenant policies.

Install [mkcert](https://github.com/FiloSottile/mkcert) and follow its instructions for installing a local certificate authority. From this repository, generate certificates outside the served directory:

```sh
mkcert -install
mkcert -cert-file ../five9-localhost.pem -key-file ../five9-localhost-key.pem localhost 127.0.0.1 ::1
npm run start:https
```

Open <https://localhost:8080/embedded-sample-2026.html>. Certificate trust setup may require administrator approval. Never commit private keys, put them in the served directory, disable TLS verification, or rely on clicking through certificate warnings for embedded integrations.

## GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) runs the browser tests, stages the testbed, and deploys `_site/` over HTTPS. No backend server, personal access token, or Five9 secret is required. Deployment uses GitHub's built-in token with scoped Pages permissions.

### First deployment

1. Ensure the workflow is pushed to `main` and `main` is the repository's default branch.
2. Open **Settings > Pages > Build and deployment** and select **GitHub Actions** as the source. Repository admin access and an organization policy/plan that permits Pages are required.
3. Open **Actions > Test and deploy testbed to GitHub Pages**, select **Run workflow**, choose `main`, and run it. An earlier failed run from before Pages was enabled does not publish the site; start a new run or rerun that deployment.
4. Wait for both `build` and `deploy` to succeed. Open the URL shown by the deployment, and verify that the page and SDK load.

The expected default URL for this repository is <https://five9developerprogram.github.io/Five9CRMSDKSamples/>. It becomes available only after Pages is enabled and a deployment succeeds. Once verified, add a prominent hosted-testbed link to the README so customers can start without installing anything.

Future pushes to `main` deploy automatically. For a fork with a different default branch, update the workflow's branch filter. Keep any `github-pages` environment deployment rules and branch protections consistent with the publishing branch.

### Hosting checks

- Treat the page as public unless your organization has explicitly configured Pages access control. A private repository does not by itself establish the site's audience.
- Do not embed credentials, customer records, or sensitive SSO URLs in the source or workflow. Authentication stays with Five9 and your IdP.
- Confirm the artifact contains only the two staged HTML files. Local dependencies, documentation, tests, and private keys must not be published.
- Validate Five9/IdP framing, browser storage, microphone access, and any trusted-origin configuration using the actual deployed origin. HTTPS does not bypass those requirements.
- Check the Actions logs for failing tests, Pages permissions, disabled Pages, or environment approval requirements if deployment fails.

## Tests

```sh
npm ci
npx playwright install chromium
npm test
```

On Linux, use `npx playwright install --with-deps chromium` when browser system dependencies are needed, as the workflow does.

Tests start their own server on port 8090 and use a fake SDK/adapter, without Five9 credentials or external CDN access. They cover document-root isolation, all 32 regional presets, defaults, custom URLs, SSO encoding, session readiness, call targeting, confirmation/cancellation, stale responses, suggested numbers, component registration, and hook inspection decisions and lifecycle. They do not certify live Five9 or Salesforce behavior.

## Live verification

Before sharing changes, validate with an appropriate test tenant:

- Login/logout, station setup, and action readiness.
- Click-to-dial enable/disable callbacks and campaign selection.
- Call-variable reads/writes and call wrap-up/disposition.
- Search results, screen-pop requests, activity callbacks, and counters.
- Hook proceed/reject behavior, timeout handling, and adapter error display.
- Custom-component rendering in the target adapter.
- Unload/reload, SSO, browser audio permissions, and the deployed HTTPS origin.

Use test accounts and approved test phone numbers. Review screenshots and copied logs for customer information before sharing them.