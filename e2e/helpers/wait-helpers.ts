import { Page, Locator } from '@playwright/test';

/**
 * Helper functions for waiting and retrying operations
 */

/**
 * Wait for table to have data
 * @param page - Playwright page object
 * @param tableSelector - Table selector
 * @param minRows - Minimum number of rows expected
 */
export async function waitForTableData(
  page: Page,
  tableSelector: string = 'table',
  minRows: number = 1
): Promise<void> {
  // Wait for table to be visible
  await page.waitForSelector(tableSelector, { state: 'visible', timeout: 10000 });
  
  // Wait for rows to appear
  const rowSelector = `${tableSelector} tbody tr`;
  await page.waitForFunction(
    ({ selector, min }) => {
      const rows = document.querySelectorAll(selector);
      return rows.length >= min;
    },
    { selector: rowSelector, min: minRows },
    { timeout: 10000 }
  );
  
  // Additional wait for data to stabilize
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for dialog to open
 * @param page - Playwright page object
 * @param dialogText - Text to identify the dialog
 */
export async function waitForDialog(
  page: Page,
  dialogText?: string
): Promise<void> {
  const dialogSelector = '[role="dialog"], [data-radix-dialog-content], .dialog-content';
  await page.waitForSelector(dialogSelector, { state: 'visible', timeout: 5000 });
  
  if (dialogText) {
    await page.waitForSelector(`${dialogSelector}:has-text("${dialogText}")`, { 
      state: 'visible', 
      timeout: 5000 
    });
  }
  
  // Wait for animations
  await page.waitForTimeout(300);
}

/**
 * Retry clicking an element
 * @param locator - Element locator
 * @param maxRetries - Maximum number of retries
 */
export async function retryClick(
  locator: Locator,
  maxRetries: number = 3
): Promise<void> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await locator.click({ timeout: 5000 });
      return; // Success
    } catch (error) {
      lastError = error as Error;
      
      // Wait before retry
      await locator.page().waitForTimeout(500);
      
      // Try to scroll element into view
      try {
        await locator.scrollIntoViewIfNeeded();
      } catch {
        // Element might not be attached yet
      }
    }
  }
  
  throw lastError || new Error('Failed to click element after retries');
}

/**
 * Safe get text from element
 * @param page - Playwright page object
 * @param selector - Element selector
 * @param defaultValue - Default value if element not found
 */
export async function safeGetText(
  page: Page,
  selector: string,
  defaultValue: string = ''
): Promise<string> {
  try {
    const element = page.locator(selector).first();
    const hasElement = await element.count() > 0;
    
    if (hasElement) {
      const text = await element.textContent({ timeout: 2000 });
      return text?.trim() || defaultValue;
    }
  } catch {
    // Element not found or timeout
  }
  
  return defaultValue;
}

/**
 * Wait for toast notification
 * @param page - Playwright page object
 * @param text - Optional text to match in toast
 */
export async function waitForToast(
  page: Page,
  text?: string
): Promise<void> {
  const toastSelector = '[data-sonner-toast], .toast, [role="alert"]';
  
  if (text) {
    await page.waitForSelector(`${toastSelector}:has-text("${text}")`, {
      state: 'visible',
      timeout: 5000
    });
  } else {
    await page.waitForSelector(toastSelector, {
      state: 'visible',
      timeout: 5000
    });
  }
}

/**
 * Wait for loading indicator to disappear
 * @param page - Playwright page object
 */
export async function waitForLoadingComplete(
  page: Page
): Promise<void> {
  // Common loading indicators
  const loadingSelectors = [
    '.loading',
    '[data-loading="true"]',
    '.spinner',
    '.skeleton',
    '[aria-busy="true"]'
  ];
  
  for (const selector of loadingSelectors) {
    try {
      await page.waitForSelector(selector, { state: 'hidden', timeout: 1000 });
    } catch {
      // Selector might not exist, continue
    }
  }
  
  // Wait for network to settle
  await page.waitForLoadState('networkidle');
}

/**
 * Safe fill input with retry
 * @param page - Playwright page object
 * @param selector - Input selector
 * @param value - Value to fill
 */
export async function safeFillInput(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  const input = page.locator(selector).first();
  
  // Wait for input to be visible and enabled
  await input.waitFor({ state: 'visible', timeout: 5000 });
  
  // Clear existing value
  await input.clear();
  
  // Type value
  await input.fill(value);
  
  // Verify value was set
  const actualValue = await input.inputValue();
  if (actualValue !== value) {
    // Retry with slower typing
    await input.clear();
    await input.type(value, { delay: 50 });
  }
}

/**
 * Wait for element and get count
 * @param page - Playwright page object
 * @param selector - Element selector
 */
export async function getElementCount(
  page: Page,
  selector: string
): Promise<number> {
  try {
    await page.waitForSelector(selector, { timeout: 2000 });
    return await page.locator(selector).count();
  } catch {
    return 0;
  }
}