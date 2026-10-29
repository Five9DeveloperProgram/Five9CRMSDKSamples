# Five9 CRM SDK Testbed

[embedded-sample-2026.html](embedded-sample-2026.html) is the primary sample: a standalone mock CRM hosting the Five9 Agent Desktop Toolkit in an iframe. It uses the [current CRM SDK](https://cdn.prod.us.five9.net/stable/crm-sdk-lib/doc/index.html) from Five9's stable CDN. No application framework, backend, or build step is required.

## Run locally

Install [Node.js 22 or newer](https://nodejs.org), then run:

```sh
npm install
npm start
```

The server opens <http://localhost:8080/embedded-sample-2026.html>. It listens only on localhost, disables caching, and requires no hosts-file entry. Startup copies only the testbed into the generated `_site/` directory, which is the server's document root. Repository metadata, dependencies, and tests are not served. Stop it with Ctrl+C. For another port:

```sh
npm start -- -p 8081
```

After editing the source HTML, run `npm run prepare:site` and refresh the browser, or restart `npm start`. The staging command replaces `_site/`; do not store source files or certificates there. This is only a file-copy step, not a bundler or compiler.

The page requires internet access for the SDK and Tailwind CSS. Live adapter testing also requires a Five9 account, appropriate domain permissions, and a configured station/campaign. Node serves the files; it does not proxy Five9 traffic or store credentials.

HTTP localhost is the simplest starting point and is treated as a trustworthy origin by modern browsers. This does not guarantee every embedded softphone, SSO, or CRM workflow will work over HTTP. Use trusted HTTPS when required, and test against your actual browser and tenant policies. Opening the page directly with `file://` is not the supported workflow.

### Optional trusted HTTPS

Install [mkcert](https://github.com/FiloSottile/mkcert) and follow its instructions to install a local certificate authority. From this repository, generate certificates **outside the served directory**:

```sh
mkcert -install
mkcert -cert-file ../five9-localhost.pem -key-file ../five9-localhost-key.pem localhost 127.0.0.1 ::1
npm run start:https
```

Open <https://localhost:8080/embedded-sample-2026.html>. Certificate trust setup may require administrator approval on your machine. Never commit private keys, put them in the served directory, disable TLS verification, or rely on clicking through certificate warnings for embedded integrations.

## Host on GitHub Pages

GitHub Pages provides HTTPS hosting for this static testbed without running Node on a server. The [deployment workflow](.github/workflows/pages.yml) runs the browser tests and publishes only the testbed and its `index.html` alias. It does not publish dependencies, tests, or local certificates.

1. Commit and push these changes to your GitHub repository.
2. In **Settings > Pages > Build and deployment**, select **GitHub Actions** as the source. Repository admin access and an organization policy/plan that permits Pages are required.
3. In **Actions**, select **Test and deploy testbed to GitHub Pages**, then **Run workflow** on `main`. Future pushes to `main` also deploy automatically. If your fork uses another default branch, update the workflow's branch filter.
4. Open the URL shown by the successful deployment. For this repository, the expected default address is <https://five9developerprogram.github.io/Five9CRMSDKSamples/>.

The address is not live merely because the workflow exists. Pages must be enabled and a deployment must succeed. No personal access token or Five9 secret is needed in the workflow; deployment uses GitHub's built-in token.

Treat the hosted page as public unless your organization has explicitly configured Pages access control. Use synthetic CRM data. Never hardcode passwords, access tokens, customer records, or sensitive SSO URLs in the source. Adapter authentication remains with Five9/your IdP; this page is not an authentication service. SDK payloads shown in the browser can contain customer information, so handle screenshots and copied logs accordingly.

HTTPS hosting does not bypass Five9/IdP framing restrictions, browser storage policies, microphone permissions, or CRM trusted-origin requirements. Validate those with the exact deployed origin. The SDK's `stable` CDN URL is intentionally a moving version for exploration, not a reproducible SDK pin.

## Explore the SDK

1. Choose a region and adapter, or edit the adapter URL directly. US Agent Desktop Toolkit remains the default; CRM API and Hook API are enabled by default. Configure optional SSO settings, then select **Load adapter**. Form controls override the URL parameters they manage while preserving unrelated parameters and fragments.
2. Sign in to Five9. **SDK: loaded** means the JavaScript library is available; SDK actions stay disabled until the adapter reports `WORKING`. Click-to-dial also honors the adapter's enable/disable callbacks.
3. Exercise click-to-dial, object navigation, presence, metadata, and suggested numbers. Suggested numbers use the phone field and a synthetic contact. Dialing depends on campaign configuration and can place a real call.
4. For call variables or dispositions, choose a call in **Active call** and fetch the corresponding list. Select a returned item before writing. Writes require confirmation; setting a disposition may finish the call. The optional timer is passed through as the SDK's `timeout` string; use values appropriate for the disposition and tenant configuration.
5. Test synthetic searches with one, multiple, zero, or rejected results. Inspect SDK events and request/result payloads in the filterable event log.

### Adapter and region presets

Native dropdowns cover US, Canada, UK, and EU for Agent Desktop Toolkit, Zendesk, Oracle, MS Dynamics, Salesforce, Salesforce Lightning, Salesforce Fusion, and ServiceNow. The standalone Agent/Supervisor Desktop Plus applications are not included. No additional libraries are required. Changing a preset updates the editable URL and SSO preview, but does not reload the iframe until **Load adapter** is selected. Editing the URL switches to **Custom URL** and disables the region selector until another preset is chosen.

Ordinary launch presets omit `f9idplogin=true`; FIS2 adds it to the nested RelayState URL. URL encoding is generated rather than stored as a second set of preset strings. Salesforce Fusion uses the supplied region-specific authentication URL unchanged, without Toolkit query flags or `f9idplogin`. With FIS2 selected, the IdP preview uses that exact Fusion URL as RelayState; **Load adapter** still opens the Fusion authentication URL directly, not the IdP preview. Toolkit SSO options are not passed to Fusion.

Presets are URL conveniences, not a guarantee of standalone embedding or CRM SDK compatibility: CRM-specific adapters can require their parent CRM, and authentication endpoints may restrict framing. Use the generic Toolkit preset for the standard testbed workflow.

Calls are discovered through lifecycle events, remain selectable during wrap-up, and are removed on finish/rejection. Selection is explicit, and call details are cleared when the selected call changes, the agent leaves `WORKING`, or the adapter reloads/unloads. Call tools currently target voice calls, not chat/email dispositions.

The **Custom adapter component** option registers a small CRM reference input and Inspect call button in the adapter's custom call tab. Its callbacks appear in the event log. Configure it before loading; rendering depends on adapter support for that location.

### Hook inspection samples

With Hook API enabled, the **Hook samples** section offers **Before Disposition Sample** and **Before Click-to-Dial Sample**. Both are off by default, so hooks initially return `Proceed`. Enabling a sample opens a native inspection dialog when that hook fires, showing the actual request payload. **Proceed** resolves the hook promise with `{ status: { statusCode: 'Proceed' } }`. **Reject** resolves it with `{ status: { statusCode: 'Error', message: '...' } }`, using your rejection reason. This is a deliberate SDK rejection response, not a rejected JavaScript promise. These samples do not modify the request.

The simulation buttons use fictional payloads and the same decision handler without invoking SDK actions, so they cannot place or disposition a call. Simulation and live-adapter requests are labeled separately. Requests and responses appear in the Hook event log, and the latest inspected decision is also shown in the sample section. Simulation payloads are illustrative; inspect actual adapter payloads before writing rules that depend on specific fields.

Sample toggles take effect without re-registering the Hook API and remain accessible after sign-in. Enable the main Hook API option before loading the adapter; changing its URL flag requires a reload. Unselected samples and other hooks remain pass-throughs. Disabling Hook API bypasses sample inspection immediately, even if the loaded adapter still sends hooks.

Dismissing the dialog, disabling a pending sample, resetting/unloading the adapter, or exceeding the testbed's 30-second decision limit returns `Error` rather than implicitly allowing the action. A concurrent inspection request is rejected while the first remains open. The adapter may enforce its own earlier timeout; live timing and error display must be validated with your deployment. Rejecting a live disposition or click-to-dial prevents that action, so use a test account.

Synthetic activity and counters live in page memory and reset on refresh. Each `saveLog` callback increments a counter; this is not persistent or deduplicated CRM storage. Search results are fictional, and screen pops are logged rather than navigating a real CRM. Use a test account and test phone numbers for live SDK actions.

## Tests and verification

```sh
npm ci
npx playwright install chromium
npm test
```

Tests start their own loopback server on port 8090 and use a fake SDK/adapter, without Five9 credentials or external CDN access. They cover all 32 regional presets, default hooks, custom URLs, URL and SSO encoding, session readiness, call targeting, confirmation/cancellation, stale responses, suggested numbers, and component/hook registration. They do not certify live Five9 or Salesforce behavior.

Before sharing an integration, check live login/logout, click-to-dial enable/disable, call wrap-up/disposition, call-variable writes, search/screen-pop callbacks, hook/component rendering, and unload/reload. Separately validate SSO, browser audio permissions, and the deployed HTTPS origin with your tenant.

## SDK documentation

- [Integrating ADT inside a web page](https://cdn.prod.us.five9.net/stable/crm-sdk-lib/doc/tutorial-basicintegration.html)
- [Configuring adapter URL parameters](https://cdn.prod.us.five9.net/stable/crm-sdk-lib/doc/tutorial-adturlparams.html)
- [Custom UI components](https://cdn.prod.us.five9.net/stable/crm-sdk-lib/doc/tutorial-customcomponents.html)
- [Building a proxy page](https://cdn.prod.us.five9.net/stable/crm-sdk-lib/doc/tutorial-proxypage.html)



