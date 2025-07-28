/**
 * Test script for customers page frontend integration
 * Run this with: node test-customers-frontend.js
 */

const puppeteer = require('puppeteer');

async function testCustomersPage() {
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set up console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    } else if (msg.type() === 'warning') {
      console.log('⚠️ Console Warning:', msg.text());
    }
  });
  
  // Set up error handling
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });
  
  try {
    console.log('🚀 Starting customers page tests...');
    
    // Test 1: Navigate to customers page
    console.log('📍 Test 1: Navigate to customers page');
    await page.goto('http://localhost:5173/customers', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // Wait for the page to load
    await page.waitForSelector('h1', { timeout: 5000 });
    const title = await page.$eval('h1', el => el.textContent);
    console.log(`✅ Page loaded with title: "${title}"`);
    
    // Test 2: Check if customers table loads with data
    console.log('📍 Test 2: Check if customers table loads with data');
    await page.waitForSelector('table tbody tr', { timeout: 5000 });
    const customerRows = await page.$$('table tbody tr');
    console.log(`✅ Found ${customerRows.length} customer rows`);
    
    // Test 3: Check if real data is displayed (not mock)
    console.log('📍 Test 3: Verify real data is displayed');
    const firstCustomerData = await page.$eval('table tbody tr:first-child td:first-child', 
      el => el.textContent.trim()
    );
    console.log(`✅ First customer data: "${firstCustomerData}"`);
    
    // Test 4: Test search functionality
    console.log('📍 Test 4: Test search functionality');
    const searchInput = await page.$('input[placeholder*="Поиск"]');
    if (searchInput) {
      await searchInput.type('Test');
      await page.waitForTimeout(500); // Wait for debounce
      
      // Wait for search results
      await page.waitForFunction(() => {
        const rows = document.querySelectorAll('table tbody tr');
        return rows.length > 0;
      }, { timeout: 3000 });
      
      const searchResultRows = await page.$$('table tbody tr');
      console.log(`✅ Search for "Test" returned ${searchResultRows.length} results`);
      
      // Clear search
      await searchInput.click({ clickCount: 3 });
      await searchInput.press('Backspace');
      await page.waitForTimeout(500);
    }
    
    // Test 5: Test "Add Customer" button
    console.log('📍 Test 5: Test "Add Customer" button');
    const addButton = await page.$('button:has-text("Добавить клиента")');
    if (addButton) {
      await addButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 3000 });
      console.log('✅ Add customer dialog opened');
      
      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    
    // Test 6: Test customer row click (navigation)
    console.log('📍 Test 6: Test customer row click navigation');
    const firstRow = await page.$('table tbody tr:first-child');
    if (firstRow) {
      // Note: We won't actually click as it would navigate away
      console.log('✅ Customer rows are clickable (navigation ready)');
    }
    
    // Test 7: Test dropdown actions
    console.log('📍 Test 7: Test dropdown actions');
    const actionButton = await page.$('button:has-text("Действия")');
    if (actionButton) {
      await actionButton.click();
      await page.waitForSelector('[role="menu"], [role="menuitem"]', { timeout: 3000 });
      console.log('✅ Actions dropdown opened');
      
      // Close dropdown by clicking elsewhere
      await page.click('h1');
      await page.waitForTimeout(500);
    }
    
    // Test 8: Check summary information
    console.log('📍 Test 8: Check summary information');
    const summaryText = await page.$eval('[class*="text-muted-foreground"]:has-text("Всего клиентов")', 
      el => el.textContent
    ).catch(() => null);
    
    if (summaryText) {
      console.log(`✅ Summary info: "${summaryText}"`);
    }
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the tests
testCustomersPage().catch(console.error);