import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Global test setup starting...');
  
  // Check backend is running
  try {
    const response = await fetch('http://localhost:8000/health');
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    console.log('✅ Backend is healthy');
  } catch (error) {
    console.error('❌ Backend is not running. Please start it with: npm run backend:dev');
    throw error;
  }

  // Perform login once for all tests
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`);
    
    // Fill phone number
    const phoneInput = page.locator('input#phone');
    await phoneInput.fill('+77011234567');
    
    // Submit phone number
    const submitButton = page.locator('button[type="submit"]:has-text("Получить код")');
    await submitButton.click();
    
    // Wait for OTP display (in DEBUG mode)
    await page.waitForSelector('text=Код подтверждения', { timeout: 5000 });
    
    // Get OTP from the page
    const otpText = await page.locator('text=/\\d{6}/').textContent();
    const otp = otpText?.match(/\d{6}/)?.[0];
    
    if (!otp) {
      throw new Error('Could not extract OTP from page');
    }
    
    // Fill OTP
    const otpInputs = page.locator('input[inputmode="numeric"]');
    const otpDigits = otp.split('');
    for (let i = 0; i < otpDigits.length; i++) {
      await otpInputs.nth(i).fill(otpDigits[i]);
    }
    
    // Submit OTP
    const verifyButton = page.locator('button[type="submit"]:has-text("Войти")');
    await verifyButton.click();
    
    // Wait for redirect to orders page
    await page.waitForURL('**/orders', { timeout: 10000 });
    
    // Save storage state
    await context.storageState({ path: 'e2e/.auth/user.json' });
    console.log('✅ Authentication successful, state saved');
    
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('✅ Global setup complete');
}

export default globalSetup;