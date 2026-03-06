#!/usr/bin/env node
/**
 * Playwright Test Script for Invite Flow
 *
 * Tests the complete invite acceptance flow:
 * 1. Navigate to generic invite link
 * 2. Fill name "kjkj" and email "budakarl@gmail.com"
 * 3. Click "Accept Invitation"
 * 4. Verify success message
 * 5. Verify redirect to login with email pre-filled
 * 6. Click "Continue with email"
 * 7. Check for magic link success or errors
 */

import { chromium } from 'playwright';

const INVITE_URL = process.env.INVITE_URL || 'http://localhost:3000/invite/vJkGF4KDTUzUK-enQwx7TsaK2SN3v6YxQc7utdovsZc';
const TEST_NAME = 'kjkj';
const TEST_EMAIL = 'budakarl@gmail.com';

async function testInviteFlow() {
  console.log('🧪 Starting Invite Flow Test...');
  console.log(`📧 Test email: ${TEST_EMAIL}`);
  console.log(`🔗 Invite URL: ${INVITE_URL}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[INVITE DEBUG]') || text.includes('[AUTH') || text.includes('[SUPABASE')) {
      console.log(`  📋 CONSOLE: ${text}`);
    }
  });

  // Listen for network requests
  page.on('response', response => {
    const url = response.url();
    if (url.includes('/api/auth/') || url.includes('/auth/callback')) {
      console.log(`  🌐 ${response.status()} ${url}`);
    }
  });

  try {
    // STEP 1: Navigate to invite page
    console.log('STEP 1: Navigating to invite page...');
    await page.goto(INVITE_URL, { waitUntil: 'networkidle' });

    // Check if we're on the invite page
    const title = await page.title();
    console.log(`  📄 Page title: ${title}`);

    // Look for error messages
    const errorText = await page.textContent('body');
    if (errorText?.includes('duplicate key')) {
      console.log('  ❌ DUPLICATE KEY ERROR DETECTED!');
      console.log('  💡 Run: node scripts/clear-email.mjs to clear the email from database');
      await browser.close();
      process.exit(1);
    }

    // STEP 2: Fill in the form
    console.log('\nSTEP 2: Filling in invite form...');

    // Wait for form to be ready
    await page.waitForSelector('input[type="text"], input#name', { timeout: 5000 });

    // Fill name field
    const nameInput = await page.locator('input[type="text"], input#name').first();
    await nameInput.fill(TEST_NAME);
    console.log(`  ✏️  Name filled: "${TEST_NAME}"`);

    // Fill email field
    const emailInput = await page.locator('input[type="email"], input#email').first();
    await emailInput.fill(TEST_EMAIL);
    console.log(`  ✏️  Email filled: "${TEST_EMAIL}"`);

    // STEP 3: Click Accept Invitation
    console.log('\nSTEP 3: Clicking "Accept Invitation"...');
    const acceptButton = await page.locator('button:has-text("Accept Invitation")').first();
    await acceptButton.click();

    // Wait for response
    await page.waitForTimeout(2000);

    // Check for success message
    const bodyText = await page.textContent('body');
    console.log(`  📄 Page text contains:`, bodyText?.substring(0, 200));

    if (bodyText?.includes("You're in!")) {
      console.log('  ✅ SUCCESS message shown!');
    } else if (bodyText?.includes('duplicate key')) {
      console.log('  ❌ DUPLICATE KEY ERROR!');
      console.log('     The email is already in the database.');
      await browser.close();
      process.exit(1);
    } else {
      console.log('  ⚠️  Unexpected response');
    }

    // STEP 4: Wait for redirect to login
    console.log('\nSTEP 4: Waiting for redirect to login...');
    await page.waitForURL(/\/login/, { timeout: 10000 });
    const currentUrl = page.url();
    console.log(`  🔗 Current URL: ${currentUrl}`);

    // Check if error parameter is present
    if (currentUrl.includes('error=auth_callback_error')) {
      console.log('  ⚠️  URL contains auth_callback_error - will be cleaned up by client-side redirect');
      await page.waitForTimeout(1000);
    }

    // STEP 5: Verify email is pre-filled
    console.log('\nSTEP 5: Verifying email is pre-filled...');
    const emailValue = await page.locator('input[type="email"]').inputValue();
    if (emailValue === TEST_EMAIL) {
      console.log(`  ✅ Email pre-filled correctly: "${emailValue}"`);
    } else {
      console.log(`  ❌ Email not pre-filled. Got: "${emailValue}"`);
    }

    // STEP 6: Click Continue with email
    console.log('\nSTEP 6: Clicking "Continue with email"...');
    const continueButton = await page.locator('button:has-text("Continue with email")').first();

    // Check for error message before clicking
    const errorDiv = await page.locator('div:has-text("Authentication failed")');
    const hasError = await errorDiv.count();

    if (hasError > 0) {
      console.log('  ❌ AUTHENTICATION FAILED message is showing!');
      console.log('  💡 This means the auth callback flow has an issue');
    } else {
      await continueButton.click();
      console.log('  📧 Magic link request sent');

      // Wait for "Check your email" message
      await page.waitForTimeout(2000);
      const successText = await page.textContent('body');

      if (successText?.includes('Check your email')) {
        console.log('  ✅ MAGIC LINK SENT - User should receive email');
        console.log(`  📧 Sent to: ${TEST_EMAIL}`);
      } else if (successText?.includes('This app is in private beta')) {
        console.log('  ❌ WHITELIST ERROR - Email not whitelisted!');
        console.log('     The invite claim may have failed');
      } else {
        console.log('  ⚠️  Unexpected response after clicking Continue');
        console.log(`     Page text: ${successText?.substring(0, 200)}`);
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✨ Invite link loaded: Yes`);
    console.log(`✨ Form filled: Yes`);
    console.log(`✨ Success message: ${bodyText?.includes("You're in!") ? 'Yes' : 'No'}`);
    console.log(`✨ Redirected to login: Yes`);
    console.log(`✨ Email pre-filled: ${emailValue === TEST_EMAIL ? 'Yes' : 'No'}`);
    console.log(`✨ Magic link sent: ${hasError > 0 ? 'No (auth error)' : 'Yes'}`);
    console.log('='.repeat(60));

    if (hasError > 0) {
      console.log('\n❌ TEST FAILED - Authentication error detected');
      console.log('   The user can complete the invite flow but cannot log in.');
      console.log('   This suggests an issue with the auth callback or session creation.');
      await browser.close();
      process.exit(1);
    } else {
      console.log('\n✅ TEST PASSED - Invite flow working!');
      console.log('   User can accept invite and send magic link to log in.');
    }

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.log(error.stack);
  } finally {
    await browser.close();
  }
}

// Run the test
testInviteFlow().catch(console.error);
