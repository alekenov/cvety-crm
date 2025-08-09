const { chromium } = require('playwright');

(async () => {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to localhost:5173...');
  try {
    await page.goto('http://localhost:5173', { timeout: 5000 });
    console.log('✓ Frontend is accessible');
    const title = await page.title();
    console.log('Page title:', title);
  } catch (error) {
    console.log('✗ Frontend not accessible:', error.message);
  }
  
  console.log('Navigating to localhost:8000/health...');
  try {
    await page.goto('http://localhost:8000/health', { timeout: 5000 });
    const content = await page.textContent('body');
    console.log('✓ Backend health:', content);
  } catch (error) {
    console.log('✗ Backend not accessible:', error.message);
  }
  
  await browser.close();
  console.log('Test completed');
})();
