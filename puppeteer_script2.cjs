const puppeteer = require('puppeteer');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set viewport to mobile size for phone screenshots
    await page.setViewport({ width: 390, height: 844 }); // iPhone 12 Pro dimensions

    console.log('Navigating to app...');
    // Vite preview default port is 4173
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 60000 });
    
    // Let any animations settle
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Taking screenshot 1...');
    await page.screenshot({ path: 'public/phone-screen-1.png' });

    // Try to interact with the app to get a different view
    console.log('Scrolling down for screenshot 2...');
    await page.evaluate(() => {
        // Find a scrollable container or just scroll window
        const main = document.querySelector('main') || document.body;
        if(main) main.scrollBy(0, 500);
        window.scrollBy(0, 500); // Scroll down 500px
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Taking screenshot 2...');
    await page.screenshot({ path: 'public/phone-screen-2.png' });

    console.log('Closing browser...');
    await browser.close();
    console.log('Done!');
})();
