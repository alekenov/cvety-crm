import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Check frontend
try {
  await page.goto('http://localhost:5182', { timeout: 5000 });
  console.log('✓ Frontend is running on port 5182');
  const title = await page.title();
  console.log('  Title:', title);
} catch (error) {
  console.log('✗ Frontend error:', error.message);
}

// Check backend
try {
  await page.goto('http://localhost:8000/health', { timeout: 5000 });
  const content = await page.textContent('body');
  console.log('✓ Backend is running on port 8000');
  console.log('  Health:', content);
} catch (error) {
  console.log('✗ Backend error:', error.message);
}

// Check API docs
try {
  await page.goto('http://localhost:8000/docs', { timeout: 5000 });
  console.log('✓ API docs available');
} catch (error) {
  console.log('✗ API docs error:', error.message);
}

await browser.close();
console.log('\nServices status check complete');
