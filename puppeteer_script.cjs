const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

(async () => {
    console.log('Starting preview server...');
    const server = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'preview'], { cwd: process.cwd() });
    
    // Wait a few seconds for the server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Server started, launching browser...');

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set viewport to mobile size for phone screenshots
    await page.setViewport({ width: 390, height: 844 }); // iPhone 12 Pro dimensions

    console.log('Navigating to app...');
    // Vite preview default port is 4173
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
    
    // Let any animations settle
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Taking screenshot 1...');
    await page.screenshot({ path: 'public/phone-screen-1.png' });

    // Try to interact with the app to get a different view
    // Assuming there is a sidebar or some navigation, or just scrolling down
    console.log('Scrolling down for screenshot 2...');
    await page.evaluate(() => {
        window.scrollBy(0, 500); // Scroll down 500px
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Taking screenshot 2...');
    await page.screenshot({ path: 'public/phone-screen-2.png' });

    console.log('Closing browser and server...');
    await browser.close();
    server.kill();
    console.log('Done!');
})();
