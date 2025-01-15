const puppeteer = require('puppeteer');

class PuppeteerService {
    constructor() {
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    async delay(time) {
        return new Promise(function(resolve) {
            setTimeout(resolve, time);
        });
    }

    async createBrowser() {
        return await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certifcate-errors',
                '--ignore-certifcate-errors-spki-list',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-web-security',
                '--no-first-run',
                '--no-zygote',
                '--single-process'
            ]
        });
    }

    async setupPage(browser) {
        const page = await browser.newPage();
        const userAgent = this.getRandomUserAgent();
        
        await page.setUserAgent(userAgent);
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
        });

        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'DNT': '1'
        });

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });

            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {},
            };

            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
            Object.defineProperty(navigator, 'platform', {
                get: () => 'Win32',
            });
        });

        return page;
    }

    async withBrowser(callback) {
        const browser = await this.createBrowser();
        try {
            return await callback(browser);
        } finally {
            await browser.close().catch(console.error);
        }
    }

    async takeScreenshot(url, options = {}) {
        return this.withBrowser(async (browser) => {
            const page = await this.setupPage(browser);
            try {
                await page.goto(url, { 
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });
                
                await this.delay(Math.random() * 1000 + 1000);

                if (options.width && options.height) {
                    await page.setViewport({
                        width: parseInt(options.width),
                        height: parseInt(options.height),
                        deviceScaleFactor: 1,
                    });
                }

                return await page.screenshot({
                    fullPage: options.fullPage === 'true',
                    type: 'png'
                });
            } finally {
                await page.close().catch(console.error);
            }
        });
    }

    async generatePDF(url, options = {}) {
        return this.withBrowser(async (browser) => {
            const page = await this.setupPage(browser);
            try {
                await page.goto(url, { 
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });
                
                await this.delay(Math.random() * 1000 + 1000);

                return await page.pdf({
                    format: options.format || 'A4',
                    landscape: options.landscape === 'true',
                    printBackground: true,
                    margin: {
                        top: '20px',
                        right: '20px',
                        bottom: '20px',
                        left: '20px'
                    }
                });
            } finally {
                await page.close().catch(console.error);
            }
        });
    }

    async getPageContent(url, selector) {
        return this.withBrowser(async (browser) => {
            const page = await this.setupPage(browser);
            try {
                await page.goto(url, { 
                    waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
                    timeout: 30000
                });
                
                await this.delay(Math.random() * 1000 + 1000);
                await page.waitForSelector('body');

                if (selector) {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    const element = await page.$(selector);
                    if (!element) {
                        throw new Error(`Element with selector "${selector}" not found`);
                    }
                    return await page.$eval(selector, el => el.innerHTML);
                }
                
                return await page.evaluate(() => {
                    const clone = document.documentElement.cloneNode(true);
                    const scripts = clone.getElementsByTagName('script');
                    while (scripts.length > 0) {
                        scripts[0].parentNode.removeChild(scripts[0]);
                    }
                    return clone.outerHTML;
                });
            } finally {
                await page.close().catch(console.error);
            }
        });
    }

    async evaluateScript(url, script) {
        return this.withBrowser(async (browser) => {
            const page = await this.setupPage(browser);
            try {
                await page.goto(url, { 
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });

                await this.delay(Math.random() * 1000 + 1000);
                return await page.evaluate(script);
            } finally {
                await page.close().catch(console.error);
            }
        });
    }

    async getMetrics(url) {
        return this.withBrowser(async (browser) => {
            const page = await this.setupPage(browser);
            try {
                await page.goto(url, { 
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });

                await this.delay(Math.random() * 1000 + 1000);
                const metrics = await page.metrics();
                const performance = await page.evaluate(() => performance.toJSON());
                
                return {
                    metrics,
                    performance
                };
            } finally {
                await page.close().catch(console.error);
            }
        });
    }

    async extractText(url, options = {}) {
        return this.withBrowser(async (browser) => {
            const page = await this.setupPage(browser);
            try {
                await page.goto(url, { 
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });

                await this.delay(Math.random() * 1000 + 1000);
                await page.waitForSelector('body');

                return await page.evaluate(() => {
                    const extractVisibleText = (element) => {
                        if (!element) return '';
                        
                        const style = window.getComputedStyle(element);
                        if (style.display === 'none' || style.visibility === 'hidden') return '';

                        const tagName = element.tagName.toLowerCase();
                        
                        if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') {
                            return '';
                        }

                        let text = '';
                        
                        for (const node of element.childNodes) {
                            if (node.nodeType === Node.TEXT_NODE) {
                                text += node.textContent.trim() + ' ';
                            } else if (node.nodeType === Node.ELEMENT_NODE) {
                                text += extractVisibleText(node);
                            }
                        }

                        switch (tagName) {
                            case 'p':
                            case 'div':
                            case 'section':
                            case 'article':
                            case 'h1':
                            case 'h2':
                            case 'h3':
                            case 'h4':
                            case 'h5':
                            case 'h6':
                                text = '\n' + text.trim() + '\n';
                                break;
                            case 'br':
                                text = '\n';
                                break;
                            case 'li':
                                text = '• ' + text.trim() + '\n';
                                break;
                        }

                        return text;
                    };

                    const text = extractVisibleText(document.body);
                    return text
                        .replace(/[\s\n]+/g, '\n')
                        .trim();
                });
            } finally {
                await page.close().catch(console.error);
            }
        });
    }

    async cleanup() {
        // This method is kept for backwards compatibility
        // but doesn't need to do anything anymore
    }
}

module.exports = new PuppeteerService();
