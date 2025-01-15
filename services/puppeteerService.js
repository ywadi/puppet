const puppeteer = require('puppeteer');

class PuppeteerService {
    constructor() {
        this.browser = null;
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

    async initBrowser() {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
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
                    '--no-zygote'
                ]
            });
        }
        return this.browser;
    }

    async setupPage(page) {
        const userAgent = this.getRandomUserAgent();
        
        // Set user agent
        await page.setUserAgent(userAgent);

        // Set default viewport
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
        });

        // Set default headers
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

        // Add common browser features
        await page.evaluateOnNewDocument(() => {
            // Override permissions
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                    Promise.resolve({ state: Notification.permission }) :
                    originalQuery(parameters)
            );

            // Pass webdriver check
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });

            // Add Chrome-specific properties
            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {},
            };

            // Add language and platform
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
            Object.defineProperty(navigator, 'platform', {
                get: () => 'Win32',
            });
        });
    }

    async getPage() {
        const browser = await this.initBrowser();
        const page = await browser.newPage();
        await this.setupPage(page);
        return page;
    }

    async takeScreenshot(url, options = {}) {
        const page = await this.getPage();
        try {
            await page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            
            // Add random delay to simulate human behavior
            await this.delay(Math.random() * 1000 + 1000);

            if (options.width && options.height) {
                await page.setViewport({
                    width: parseInt(options.width),
                    height: parseInt(options.height),
                    deviceScaleFactor: 1,
                });
            }

            const screenshot = await page.screenshot({
                fullPage: options.fullPage === 'true',
                type: 'png'
            });

            return screenshot;
        } finally {
            await page.close();
        }
    }

    async generatePDF(url, options = {}) {
        const page = await this.getPage();
        try {
            await page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: 30000
            });
            
            // Add random delay to simulate human behavior
            await this.delay(Math.random() * 1000 + 1000);

            const pdf = await page.pdf({
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

            return pdf;
        } finally {
            await page.close();
        }
    }

    async getPageContent(url, selector) {
        const page = await this.getPage();
        try {
            await page.goto(url, { 
                waitUntil: ['networkidle0', 'domcontentloaded', 'load'],
                timeout: 30000
            });
            
            // Add random delay to simulate human behavior
            await this.delay(Math.random() * 1000 + 1000);

            // Wait for the body to ensure DOM is fully loaded
            await page.waitForSelector('body');

            // Additional wait for dynamic content
            await page.evaluate(() => {
                return new Promise((resolve) => {
                    let checkReady = () => {
                        // Check if there are any pending XHR requests
                        const anyPendingXHR = window.performance
                            .getEntriesByType('resource')
                            .some(r => r.initiatorType === 'xmlhttprequest' && !r.responseEnd);
                        
                        // Check if there are any pending network connections
                        const anyPendingFetch = window.fetch && window.performance
                            .getEntriesByType('resource')
                            .some(r => r.initiatorType === 'fetch' && !r.responseEnd);

                        // Check if any animations are running
                        const anyRunningAnimations = document.getAnimations().some(a => a.playState === 'running');

                        if (!anyPendingXHR && !anyPendingFetch && !anyRunningAnimations) {
                            resolve();
                        } else {
                            setTimeout(checkReady, 100);
                        }
                    };
                    checkReady();
                });
            }).catch(() => {
                console.log('Timeout waiting for all dynamic content, proceeding anyway');
            });

            if (selector) {
                await page.waitForSelector(selector, { timeout: 5000 });
                const element = await page.$(selector);
                if (!element) {
                    throw new Error(`Element with selector "${selector}" not found`);
                }
                return await page.$eval(selector, el => el.innerHTML);
            }
            
            const content = await page.evaluate(() => {
                const clone = document.documentElement.cloneNode(true);
                const scripts = clone.getElementsByTagName('script');
                while (scripts.length > 0) {
                    scripts[0].parentNode.removeChild(scripts[0]);
                }
                return clone.outerHTML;
            });
            
            return content;
        } finally {
            await page.close();
        }
    }

    async evaluateScript(url, script) {
        const page = await this.getPage();
        try {
            await page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            // Add random delay to simulate human behavior
            await this.delay(Math.random() * 1000 + 1000);

            return await page.evaluate(script);
        } finally {
            await page.close();
        }
    }

    async getMetrics(url) {
        const page = await this.getPage();
        try {
            await page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            // Add random delay to simulate human behavior
            await this.delay(Math.random() * 1000 + 1000);

            const metrics = await page.metrics();
            const performance = await page.evaluate(() => performance.toJSON());
            
            return {
                metrics,
                performance
            };
        } finally {
            await page.close();
        }
    }

    async extractText(url, options = {}) {
        const page = await this.getPage();
        try {
            await page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            // Add random delay to simulate human behavior
            await this.delay(Math.random() * 1000 + 1000);

            // Wait for body to ensure DOM is loaded
            await page.waitForSelector('body');

            const text = await page.evaluate(() => {
                // Function to get visible text while preserving some structure
                const extractVisibleText = (element) => {
                    if (!element) return '';
                    
                    // Skip hidden elements
                    const style = window.getComputedStyle(element);
                    if (style.display === 'none' || style.visibility === 'hidden') return '';

                    // Handle different tag names differently
                    const tagName = element.tagName.toLowerCase();
                    
                    // Skip script and style elements
                    if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') {
                        return '';
                    }

                    // Get text content
                    let text = '';
                    
                    // Handle text nodes
                    for (const node of element.childNodes) {
                        if (node.nodeType === Node.TEXT_NODE) {
                            text += node.textContent.trim() + ' ';
                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                            text += extractVisibleText(node);
                        }
                    }

                    // Add appropriate spacing based on tag type
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

                // Start extraction from body
                const text = extractVisibleText(document.body);
                
                // Clean up the text
                return text
                    .replace(/[\s\n]+/g, '\n')  // Replace multiple spaces/newlines with single newline
                    .trim();                     // Remove leading/trailing whitespace
            });

            return text;
        } finally {
            await page.close();
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

module.exports = new PuppeteerService();
