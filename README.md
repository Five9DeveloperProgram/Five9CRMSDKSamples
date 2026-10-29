# Five9 CRM SDK Testbed

**[Open the live testbed](https://five9developerprogram.github.io/Five9CRMSDKSamples/)**

Try it in your browser without cloning this repository or installing anything locally.

## DISCLAIMER

This repository contains sample code which is **not an official Five9 resource**. It is intended solely for educational and illustrative purposes to demonstrate possible ways to interact with Five9 APIs.

Under the [MIT License](LICENSE):

- This is **not** officially endorsed or supported software by Five9.
- Any customizations, modifications, or deployments made with this code are done at your **own risk** and **sole responsibility**.
- The code may not account for all use cases or meet specific requirements without further development.
- Five9 assumes **no liability** and provides **no support** for issues arising from the use of this code.

For production-ready tailored implementations, we strongly recommend working with Five9’s Professional Services and Technical Account Management teams.

## About the testbed

Explore how the [Five9 CRM SDK](https://cdn.prod.us.five9.net/stable/crm-sdk-lib/doc/index.html) connects a CRM page to the Five9 Agent Desktop Toolkit. This interactive sample hosts the adapter alongside a mock CRM so you can inspect events, try SDK methods, and see how callbacks and hooks affect an interaction.

The implementation is contained in [embedded-sample-2026.html](embedded-sample-2026.html), using plain JavaScript and the SDK from Five9's stable CDN. Read the sample alongside the event log to follow requests and responses.

## Start exploring

You can explore synthetic CRM state and hook simulations without signing in to Five9. Live adapter features require a Five9 account, appropriate domain permissions, and a configured station and campaign. Internet access is required to load the SDK and page styling.

### Try a hook without a live call

1. Leave **Hook API** enabled and find the **Hook samples** section.
2. Enable **Before Disposition Sample** or **Before Click-to-Dial Sample**.
3. Select the corresponding **Simulate** button to inspect a fictional request.
4. Choose **Proceed**, or enter a reason and select **Reject**.
5. Inspect **Latest sample decision** and the Hook entries in the event log to see the returned SDK response.

Simulations do not call the adapter, place calls, or change dispositions. You can also add synthetic activity, adjust the mock CRM counters, and select the search response the CRM will return during live interactions.

**Use a test account and approved test phone numbers. Live SDK actions can place real calls, change call data, or finish interactions.**

## Run locally

Clone or download this repository and install [Node.js 22 or newer](https://nodejs.org). From the repository directory, run:

```sh
npm install
npm start
```

The testbed opens at <http://localhost:8080/embedded-sample-2026.html>. Stop the server with Ctrl+C. For another port, use `npm start -- -p 8081`.

Some sign-in or embedded softphone workflows require trusted HTTPS. See the [development and hosting guide](DEVELOPMENT.md#trusted-local-https) for setup. Opening the HTML directly with `file://` is not the supported workflow.

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

## Sample limitations

- This is a learning and integration-testing sample, not a production CRM integration.
- Browser microphone permissions, storage policies, IdP framing restrictions, and your organization's trusted-origin requirements still apply, including on HTTPS.
- SDK payloads may contain customer information. Use synthetic data where possible and handle screenshots and copied logs accordingly. Never hardcode credentials or sensitive customer data in the sample.
- The SDK's `stable` CDN URL follows Five9 updates rather than pinning a specific version. Validate behavior with your browser, tenant, and adapter before adapting the sample for production.

## SDK documentation

- [Integrating ADT inside a web page](https://cdn.prod.us.five9.net/stable/crm-sdk-lib/doc/tutorial-basicintegration.html)
- [Configuring adapter URL parameters](https://cdn.prod.us.five9.net/stable/crm-sdk-lib/doc/tutorial-adturlparams.html)
- [Custom UI components](https://cdn.prod.us.five9.net/stable/crm-sdk-lib/doc/tutorial-customcomponents.html)
- [Building a proxy page](https://cdn.prod.us.five9.net/stable/crm-sdk-lib/doc/tutorial-proxypage.html)
- [Hook callbacks](https://cdn.prod.us.five9.net/stable/crm-sdk-lib/doc/HookApiCallbacks.html)

For source changes, tests, and publishing your own copy, see [Development and hosting](DEVELOPMENT.md).
## Tests and verification



```sh

