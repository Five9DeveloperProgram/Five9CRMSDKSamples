const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

test.beforeEach(async ({ page }) => {
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'text/css', body: '.hidden { display: none; }' }));
    await page.route('https://cdn.prod.us.five9.net/**', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
    await page.route(/^https:\/\/(?:app|auth)\./, route => route.fulfill({ contentType: 'text/html', body: '<title>Mock adapter</title>' }));
    await page.addInitScript(() => {
        const calls = [];
        const record = name => params => {
            calls.push({ name, params });
            return Promise.resolve([]);
        };
        const application = { subscribe: handlers => { window.testSdk.application = handlers; } };
        const interaction = { subscribe: handlers => { window.testSdk.interaction = handlers; } };
        ['click2dial', 'objectVisited', 'getMetadata', 'getCav', 'setCav', 'getDispositions', 'setDisposition'].forEach(name => {
            interaction[name] = record(name);
        });
        window.testSdk = { calls };
        window.Five9 = { CrmSdk: {
            applicationApi: () => application,
            interactionApi: () => interaction,
            presenceApi: () => ({ subscribe() {}, getPresence: record('getPresence') }),
            crmApi: () => ({ registerApi: handlers => { window.testSdk.crm = handlers; }, suggestedNumbers: record('suggestedNumbers') }),
            hookApi: () => ({ registerApi: handlers => { window.testSdk.hooks = handlers; } }),
            customComponentsApi: () => ({ registerCustomComponents: record('registerCustomComponents') })
        } };
    });
    await page.goto('/embedded-sample-2026.html');
});

async function signIn(page) {
    await page.locator('#loadAdapterButton').click();
    await page.evaluate(() => window.testSdk.application.loginStateChanged({ state: 'WORKING' }));
}

test('preview serves only the staged testbed', async ({ request }) => {
    const root = await request.get('/');
    expect(root.status()).toBe(200);
    expect(await root.text()).toContain('Embedded Adapter Testbed');
    for (const resource of ['/.git/config', '/package.json', '/node_modules/http-server/package.json', '/tests/testbed.spec.js', '/../package.json', '/%2e%2e/package.json']) {
        expect((await request.get(resource)).status()).toBe(404);
    }
});

test('Pages staging isolates both samples and enables Brad mode only under its own path', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'crm-pages-'));
    const sample = 'embedded-sample-2026.html';
    try {
        fs.mkdirSync(path.join(root, 'scripts'));
        fs.mkdirSync(path.join(root, 'experiment'));
        fs.copyFileSync(path.join(__dirname, '../scripts/prepare-site.js'), path.join(root, 'scripts/prepare-site.js'));
        fs.writeFileSync(path.join(root, sample), '<title>Main sample</title>');
        fs.writeFileSync(path.join(root, 'experiment', sample), '<title>Brad sample</title>');
        fs.writeFileSync(path.join(root, 'experiment', 'private.pem'), 'not for publishing');
        const stage = (...args) => execFileSync(process.execPath, ['scripts/prepare-site.js', ...args], { cwd: root, stdio: 'pipe' });
        stage('experiment');
        const output = path.join(root, '_site');
        expect(fs.readdirSync(output).sort()).toEqual(['brad-mode', sample, 'index.html'].sort());
        expect(fs.readFileSync(path.join(output, 'index.html'), 'utf8')).toBe('<title>Main sample</title>');
        expect(fs.readFileSync(path.join(output, sample), 'utf8')).toBe('<title>Main sample</title>');
        expect(fs.readdirSync(path.join(output, 'brad-mode')).sort()).toEqual([sample, 'index.html'].sort());
        expect(fs.readFileSync(path.join(output, 'brad-mode', sample), 'utf8')).toBe('<title>Brad sample</title>');
        expect(fs.readFileSync(path.join(output, 'brad-mode', 'index.html'), 'utf8')).toContain(`content="0;url=./${sample}?fun=brad"`);
        expect(() => stage('missing-branch')).toThrow();
        expect(fs.existsSync(path.join(output, 'brad-mode', sample))).toBe(true);
        stage();
        expect(fs.readdirSync(output).sort()).toEqual([sample, 'index.html'].sort());
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test('URL options replace existing values and preserve fragments', async ({ page }) => {
    await page.locator('#adapterUrl').fill('https://app.five9.com/clients/integrations/adt.main.html?f9crmapi=false&f9crmapi=false&f9hookapi=true&keep=yes#section');
    await page.locator('#hookApiToggle').uncheck();
    await page.locator('#loadAdapterButton').click();
    const url = new URL(await page.locator('#adapterFrame').getAttribute('src'));
    expect(url.searchParams.getAll('f9crmapi')).toEqual(['true']);
    expect(url.searchParams.has('f9hookapi')).toBe(false);
    expect(url.searchParams.get('keep')).toBe('yes');
    expect(url.hash).toBe('#section');
    await page.locator('#crmApiToggle').uncheck();
    await page.locator('#loadAdapterButton').click();
    expect(new URL(await page.locator('#adapterFrame').getAttribute('src')).searchParams.has('f9crmapi')).toBe(false);
});

test('SSO and RelayState survive nested encoding', async ({ page }) => {
    await page.locator('#ssoLoginUrl').fill('https://idp.example/login?tenant=a%26b&RelayState=old#login');
    await page.locator('#fis2Toggle').check();
    await page.locator('#autoSsoToggle').check();
    await page.locator('#loadAdapterButton').click();
    const adapter = new URL(await page.locator('#adapterFrame').getAttribute('src'));
    const idp = new URL(adapter.searchParams.get('idpLoginUrl'));
    const relay = new URL(idp.searchParams.get('RelayState'));
    expect(idp.searchParams.get('tenant')).toBe('a&b');
    expect(idp.searchParams.getAll('RelayState')).toHaveLength(1);
    expect(idp.hash).toBe('#login');
    expect(relay.searchParams.get('f9idplogin')).toBe('true');
    expect(relay.searchParams.get('f9crmapi')).toBe('true');
    expect(adapter.searchParams.get('autoSsoLogin')).toBe('true');
});

test('invalid URLs do not navigate the adapter', async ({ page }) => {
    await page.locator('#adapterUrl').fill('javascript:alert(1)');
    await page.locator('#loadAdapterButton').click();
    await expect(page.locator('#adapterFrame')).not.toHaveAttribute('src');
    await expect(page.locator('#eventLog')).toContainText('Invalid adapter configuration');
});

test('actions follow login, click-to-dial callbacks, logout and unload', async ({ page }) => {
    await expect(page.locator('#clickToDialButton')).toBeDisabled();
    await page.locator('#loadAdapterButton').click();
    await page.evaluate(() => window.testSdk.application.sessionInitialized());
    await expect(page.locator('#presenceButton')).toBeDisabled();
    await page.evaluate(() => window.testSdk.application.loginStateChanged({ state: 'WORKING' }));
    await expect(page.locator('#clickToDialButton')).toBeEnabled();
    await page.evaluate(() => window.testSdk.crm.disableClickToDial());
    await expect(page.locator('#clickToDialButton')).toBeDisabled();
    await page.evaluate(() => window.testSdk.crm.enableClickToDial());
    await page.locator('#clickToDialButton').click();
    expect(await page.evaluate(() => window.testSdk.calls.at(-1))).toMatchObject({ name: 'click2dial', params: { click2DialData: { clickToDialNumber: '9250000111' } } });
    await page.evaluate(() => window.testSdk.application.loginStateChanged({ state: 'LOGGED_OUT' }));
    await expect(page.locator('#presenceButton')).toBeDisabled();
    await page.locator('#unloadAdapterButton').click();
    await page.evaluate(() => window.testSdk.application.loginStateChanged({ state: 'WORKING' }));
    await expect(page.locator('#presenceButton')).toBeDisabled();
    await expect(page.locator('#adapterFrame')).toHaveAttribute('src', 'about:blank');
});

test('SDK failures are logged without uncaught errors', async ({ page }) => {
    await signIn(page);
    await page.evaluate(() => {
        window.Five9.CrmSdk.interactionApi().getMetadata = () => Promise.reject(new Error('Synthetic failure'));
    });
    await page.locator('#metadataButton').click();
    await expect(page.locator('#eventLog')).toContainText('Synthetic failure');
});

test('call tools target the selected call and retain ended calls for disposition', async ({ page }) => {
    await signIn(page);
    await expect(page.locator('#getCavButton')).toBeDisabled();
    await page.evaluate(() => {
        window.testSdk.interaction.callStarted({ callData: { interactionId: 'call-1', number: '5550100' } });
        window.testSdk.interaction.callStarted({ callData: { interactionId: 'call-2', number: '5550101' } });
        window.Five9.CrmSdk.interactionApi().getCav = params => {
            window.testSdk.calls.push({ name: 'getCav', params });
            return Promise.resolve([{ id: '641', name: 'Reference', value: 'original' }]);
        };
        window.Five9.CrmSdk.interactionApi().getDispositions = params => {
            window.testSdk.calls.push({ name: 'getDispositions', params });
            return Promise.resolve([{ id: '3558', name: 'Complete' }]);
        };
    });
    await expect(page.locator('#getCavButton')).toBeDisabled();
    await page.locator('#activeCall').selectOption('call-2');
    await page.locator('#getCavButton').click();
    await page.locator('#cavId').selectOption('641');
    await expect(page.locator('#cavValue')).toHaveValue('original');
    await page.locator('#cavValue').fill('updated');
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#setCavButton').click();
    expect(await page.evaluate(() => window.testSdk.calls.filter(call => call.name === 'setCav'))).toHaveLength(0);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#setCavButton').click();
    expect(await page.evaluate(() => window.testSdk.calls.at(-1))).toEqual({ name: 'setCav', params: { interactionId: 'call-2', cavList: [{ id: '641', value: 'updated' }] } });
    await page.evaluate(() => window.testSdk.interaction.callEnded({ callData: { interactionId: 'call-2' } }));
    await page.locator('#getDispositionsButton').click();
    await page.locator('#dispositionId').selectOption('3558');
    await page.locator('#dispositionTimeout').fill('60');
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#setDispositionButton').click();
    expect(await page.evaluate(() => window.testSdk.calls.at(-1))).toEqual({ name: 'setDisposition', params: { interactionType: 'Call', interactionId: 'call-2', dispositionId: '3558', timeout: '60' } });
    await page.evaluate(() => window.testSdk.interaction.callFinished({ callData: { interactionId: 'call-2' } }));
    await expect(page.locator('#activeCall')).toHaveValue('');
    await expect(page.locator('#setDispositionButton')).toBeDisabled();
    await expect(page.locator('#activeCall option')).toHaveCount(2);
});

test('late call data cannot populate a different call', async ({ page }) => {
    await signIn(page);
    await page.evaluate(() => {
        window.testSdk.interaction.callStarted({ callData: { interactionId: 'call-1' } });
        window.testSdk.interaction.callStarted({ callData: { interactionId: 'call-2' } });
        window.Five9.CrmSdk.interactionApi().getCav = () => new Promise(resolve => { window.testSdk.resolveCav = resolve; });
    });
    await page.locator('#activeCall').selectOption('call-1');
    await page.locator('#getCavButton').click();
    await page.locator('#activeCall').selectOption('call-2');
    await page.evaluate(() => window.testSdk.resolveCav([{ id: 'old', name: 'Wrong call' }]));
    await expect(page.locator('#cavId option')).toHaveCount(1);
});

test('suggested numbers and optional components use the SDK contracts', async ({ page }) => {
    await page.locator('#customComponentsToggle').check();
    await page.locator('#hookApiToggle').check();
    await signIn(page);
    await page.locator('#suggestedNumbersButton').click();
    const calls = await page.evaluate(() => window.testSdk.calls);
    expect(calls.find(call => call.name === 'suggestedNumbers')).toMatchObject({ params: { suggestedNumbers: [{ clickToDialNumber: '9250000111', crmObject: { id: '123' } }] } });
    expect(calls.find(call => call.name === 'registerCustomComponents').params.template).toContain('3rdPartyComp-li-call-tab');
    expect(await page.evaluate(() => window.testSdk.hooks.beforeSaveLog({}))).toEqual({ status: { statusCode: 'Proceed' } });
});

test('US Toolkit and pass-through hooks are enabled by default', async ({ page }) => {
    await expect(page.locator('#adapterRegion')).toHaveValue('us');
    await expect(page.locator('#adapterType')).toHaveValue('adt');
    expect(await page.locator('#adapterType option').evaluateAll(options => options.map(option => option.value))).toEqual([
        'adt', 'dynamics', 'oracle', 'salesforce', 'fusion', 'lightning', 'servicenow', 'zendesk', 'custom'
    ]);
    await expect(page.locator('#adapterUrl')).toHaveValue('https://app.five9.com/clients/integrations/adt.main.html');
    await expect(page.locator('#hookApiToggle')).toBeChecked();
    await expect(page.locator('#hookApiOptions')).toBeVisible();
    await page.locator('#loadAdapterButton').click();
    expect(new URL(await page.locator('#adapterFrame').getAttribute('src')).searchParams.get('f9hookapi')).toBe('true');
    expect(await page.evaluate(() => window.testSdk.hooks.beforeMakeCall({}))).toEqual({ status: { statusCode: 'Proceed' } });
});

const regions = [
    { key: 'us', host: 'app.five9.com', fusion: 'https://auth.five9.com/home/oidc_client/0oaor2bimkrlTwr7V5d7/aln177a159h7Zf52X0g8' },
    { key: 'ca', host: 'app.ca.five9.com', fusion: 'https://auth.ca.five9.com/home/oidc_client/0oa10ra5tcnhQDCIR698/aln177a159h7Zf52X0g8' },
    { key: 'uk', host: 'app.five9.eu', fusion: 'https://auth.five9.eu/home/oidc_client/0oaund9edxFfr0iZ8417/aln177a159h7Zf52X0g8' },
    { key: 'eu', host: 'app.eu.five9.com', fusion: 'https://auth.eu.five9.com/home/oidc_client/0oaund7841H9SkbSv417/aln177a159h7Zf52X0g8' }
];
const adapterPaths = {
    adt: '/clients/integrations/adt.main.html',
    zendesk: '/clients/integrations/zd.main.html',
    oracle: '/clients/integrations/rn.main.html',
    dynamics: '/clients/integrations/msdyn.main.html',
    salesforce: '/clients/integrations/sf.main.html',
    lightning: '/clients/integrations/sfli.main.html',
    servicenow: '/clients/integrations/sn.main.html'
};

for (const region of regions) {
    test(`${region.key} presets and Fusion RelayState match the supplied endpoints`, async ({ page }) => {
        await page.locator('#adapterRegion').selectOption(region.key);
        for (const [type, path] of Object.entries(adapterPaths)) {
            await page.locator('#adapterType').selectOption(type);
            await expect(page.locator('#adapterUrl')).toHaveValue(`https://${region.host}${path}`);
        }
        await page.locator('#adapterType').selectOption('fusion');
        await expect(page.locator('#adapterUrl')).toHaveValue(region.fusion);
        await page.locator('#ssoLoginUrl').fill('https://idp.example/login?tenant=a%26b');
        await page.locator('#fis2Toggle').check();
        const preview = new URL(await page.locator('#fis2Preview').textContent());
        expect(preview.searchParams.get('RelayState')).toBe(region.fusion);
        expect(preview.searchParams.get('tenant')).toBe('a&b');
        await page.locator('#loadAdapterButton').click();
        await expect(page.locator('#adapterFrame')).toHaveAttribute('src', region.fusion);
    });
}

test('regional adapter presets update the SSO preview without navigating the adapter', async ({ page }) => {
    await page.locator('#ssoLoginUrl').fill('https://idp.example/login');
    await page.locator('#fis2Toggle').check();
    await page.locator('#adapterType').selectOption('lightning');
    await page.locator('#adapterRegion').selectOption('ca');
    const preview = new URL(await page.locator('#fis2Preview').textContent());
    const relay = new URL(preview.searchParams.get('RelayState'));
    expect(relay.origin).toBe('https://app.ca.five9.com');
    expect(relay.pathname).toBe('/clients/integrations/sfli.main.html');
    expect(relay.searchParams.get('f9idplogin')).toBe('true');
    expect(relay.searchParams.getAll('f9hookapi')).toEqual(['true']);
    await expect(page.locator('#adapterFrame')).not.toHaveAttribute('src');
});

test('manual URL edits select Custom without losing input', async ({ page }) => {
    const custom = 'https://app.five9.com/custom.html?keep=yes#section';
    await page.locator('#adapterUrl').fill(custom);
    await expect(page.locator('#adapterType')).toHaveValue('custom');
    await expect(page.locator('#adapterRegion')).toBeDisabled();
    await expect(page.locator('#adapterUrl')).toHaveValue(custom);
    await page.locator('#adapterType').selectOption('adt');
    await expect(page.locator('#adapterRegion')).toBeEnabled();
    await page.locator('#adapterRegion').selectOption('eu');
    await expect(page.locator('#adapterUrl')).toHaveValue('https://app.eu.five9.com/clients/integrations/adt.main.html');
});

test('hook samples are opt-in and simulations never invoke SDK actions', async ({ page }) => {
    await expect(page.locator('#hookSamplesSection')).toBeVisible();
    const dispositionButton = await page.locator('#simulateDispositionHook').boundingBox();
    const clickToDialButton = await page.locator('#simulateClickToDialHook').boundingBox();
    expect(dispositionButton.width).toBe(clickToDialButton.width);
    await expect(page.locator('#beforeDispositionSample')).not.toBeChecked();
    await expect(page.locator('#simulateDispositionHook')).toBeDisabled();
    await page.locator('#beforeDispositionSample').check();
    await page.locator('#simulateDispositionHook').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#hookRequestSource')).toHaveText('Simulation');
    await expect(page.locator('#hookRequestPayload')).toContainText('sample-call');
    await page.locator('#proceedHookButton').click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.locator('#hookSampleResult')).toContainText('"statusCode": "Proceed"');
    await page.locator('#beforeClickToDialSample').check();
    await page.locator('#simulateClickToDialHook').click();
    await page.locator('#hookRejectReason').fill('Sample number is blocked');
    await page.locator('#rejectHookButton').click();
    await expect(page.locator('#hookSampleResult')).toContainText('"statusCode": "Error"');
    await expect(page.locator('#hookSampleResult')).toContainText('Sample number is blocked');
    expect(await page.evaluate(() => window.testSdk.calls)).toEqual([]);
    await page.locator('#hookApiToggle').uncheck();
    await expect(page.locator('#hookSamplesSection')).toBeHidden();
});

test('registered hooks inspect live payloads and return SDK decision objects', async ({ page }) => {
    await signIn(page);
    await expect(page.locator('#hookSamplesSection')).toBeVisible();
    expect(await page.evaluate(() => window.testSdk.hooks.beforeDisposition({}))).toEqual({ status: { statusCode: 'Proceed' } });
    await page.locator('#beforeDispositionSample').check();
    await page.evaluate(() => {
        window.testSdk.hookDecision = window.testSdk.hooks.beforeDisposition({ interactionType: 'Call', interactionId: 'call-42', dispositionId: 'done' });
    });
    await expect(page.locator('#hookRequestSource')).toHaveText('Live adapter');
    await expect(page.locator('#hookRequestPayload')).toContainText('call-42');
    await page.locator('#hookRejectReason').fill('Review the CRM record first');
    await page.locator('#rejectHookButton').click();
    expect(await page.evaluate(() => window.testSdk.hookDecision)).toEqual({ status: { statusCode: 'Error', message: 'Review the CRM record first' } });
    await page.evaluate(() => { window.testSdk.hookDecision = window.testSdk.hooks.beforeDisposition({ interactionId: 'call-42' }); });
    await page.locator('#proceedHookButton').click();
    expect(await page.evaluate(() => window.testSdk.hookDecision)).toEqual({ status: { statusCode: 'Proceed' } });
    await page.locator('#beforeDispositionSample').uncheck();
    expect(await page.evaluate(() => window.testSdk.hooks.beforeDisposition({}))).toEqual({ status: { statusCode: 'Proceed' } });
    expect(await page.evaluate(() => window.testSdk.hooks.beforeSaveLog({}))).toEqual({ status: { statusCode: 'Proceed' } });
    await expect(page.locator('#eventLog')).toContainText('beforeDisposition response (adapter)');
});

test('hook inspection rejects dismissal, timeout, competing requests and session reset', async ({ page }) => {
    await page.clock.install();
    await page.locator('#loadAdapterButton').click();
    await page.locator('#beforeDispositionSample').check();
    await page.evaluate(() => { window.testSdk.hookDecision = window.testSdk.hooks.beforeDisposition({ interactionId: 'first' }); });
    expect(await page.evaluate(() => window.testSdk.hooks.beforeDisposition({ interactionId: 'second' }))).toMatchObject({ status: { statusCode: 'Error' } });
    await expect(page.locator('#hookRequestPayload')).toContainText('first');
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => window.testSdk.hookDecision)).toMatchObject({ status: { statusCode: 'Error', message: 'Hook inspection was dismissed.' } });
    await page.evaluate(() => { window.testSdk.hookDecision = window.testSdk.hooks.beforeDisposition({}); });
    await page.clock.fastForward(30000);
    expect(await page.evaluate(() => window.testSdk.hookDecision)).toMatchObject({ status: { statusCode: 'Error', message: 'Hook inspection timed out after 30 seconds.' } });
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await page.evaluate(() => { window.testSdk.hookDecision = window.testSdk.hooks.beforeDisposition({}); });
    await page.evaluate(() => document.getElementById('unloadAdapterButton').click());
    expect(await page.evaluate(() => window.testSdk.hookDecision)).toMatchObject({ status: { statusCode: 'Error', message: 'Adapter session changed while awaiting a hook decision.' } });
});

test('disabling Hook API settles an outstanding sample and restores pass-through', async ({ page }) => {
    await page.locator('#loadAdapterButton').click();
    await page.locator('#beforeDispositionSample').check();
    await page.evaluate(() => { window.testSdk.hookDecision = window.testSdk.hooks.beforeDisposition({}); });
    await page.evaluate(() => document.getElementById('hookApiToggle').click());
    expect(await page.evaluate(() => window.testSdk.hookDecision)).toMatchObject({ status: { statusCode: 'Error' } });
    await expect(page.locator('#hookSamplesSection')).toBeHidden();
    expect(await page.evaluate(() => window.testSdk.hooks.beforeDisposition({}))).toEqual({ status: { statusCode: 'Proceed' } });
});