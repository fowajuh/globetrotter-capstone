const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE UNCAUGHT EXCEPTION:', err.toString());
  });

  try {
    await page.goto('http://localhost:8080/trips/gt-001', { waitUntil: 'networkidle0', timeout: 10000 });
  } catch (e) {
    console.log('GOTO ERROR:', e.toString());
  }

  // Also check discover page
  try {
    await page.goto('http://localhost:8080/recommendations?tripId=gt-001', { waitUntil: 'networkidle0', timeout: 10000 });
  } catch (e) {}

  await browser.close();
})();
