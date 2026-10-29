const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests',
    use: {
        baseURL: 'http://127.0.0.1:8090',
        browserName: 'chromium'
    },
    webServer: {
        command: 'npm run prepare:site && npx http-server _site -a 127.0.0.1 -p 8090 -c-1 --no-dotfiles -d false',
        url: 'http://127.0.0.1:8090/embedded-sample-2026.html',
        reuseExistingServer: false
    }
});