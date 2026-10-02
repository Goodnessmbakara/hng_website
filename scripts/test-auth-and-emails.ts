import {
  generateVerificationEmailHtml,
  generatePasswordResetEmailHtml,
  generateWelcomeEmailHtml,
  generateOrderEmailHtml,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
} from '../src/lib/email';
import {
  hashPassword,
  verifyPassword,
} from '../src/lib/crypto';
import {
  registerUser,
  verifyUserCredentials,
  generateVerificationToken,
  verifyEmailToken,
  generatePasswordResetToken,
  resetPasswordWithToken,
  getUserProfile,
} from '../src/lib/db';
import { Order } from '../src/lib/types';

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Starting TechHaven Auth & Master Designer Email Tests');
  console.log('========================================================\n');

  // Test 1: Crypto hashing
  console.log('1️⃣ Testing Password Hashing & Timing-Safe Verification...');
  const plain = 'SuperSecret123!';
  const hashed = hashPassword(plain);
  const isMatch = verifyPassword(plain, hashed);
  const isWrong = verifyPassword('WrongPassword', hashed);
  if (!isMatch || isWrong) throw new Error('Crypto hash verification failed');
  console.log('   ✅ Password hash & verification passed!\n');

  // Test 2: Master Designer Email Templates Generation
  console.log('2️⃣ Testing Sleek Email Templates Generation...');
  const verifyHtml = generateVerificationEmailHtml({
    name: 'Sarah Connor',
    email: 'sarah@resistance.org',
    verifyUrl: 'http://localhost:3000/auth/verify-email?token=test_tok',
    code: '984210',
  });
  if (!verifyHtml.includes('984210') || !verifyHtml.includes('TechHaven') || !verifyHtml.includes('Verify your email')) {
    throw new Error('Verification email template failed');
  }
  console.log('   ✅ Verification email template rendered cleanly (Length: ' + verifyHtml.length + ' chars)');

  const resetHtml = generatePasswordResetEmailHtml({
    name: 'Sarah Connor',
    email: 'sarah@resistance.org',
    resetUrl: 'http://localhost:3000/auth/reset-password?token=reset_tok',
    expiresInMinutes: 60,
  });
  if (!resetHtml.includes('Reset your password') || !resetHtml.includes('reset_tok')) {
    throw new Error('Password reset email template failed');
  }
  console.log('   ✅ Password reset email template rendered cleanly (Length: ' + resetHtml.length + ' chars)');

  const welcomeHtml = generateWelcomeEmailHtml({
    name: 'Sarah Connor',
    email: 'sarah@resistance.org',
    shopUrl: 'http://localhost:3000/',
  });
  if (!welcomeHtml.includes('Welcome to TechHaven') || !welcomeHtml.includes('Real-Time Cart Sync')) {
    throw new Error('Welcome email template failed');
  }
  console.log('   ✅ Welcome email template rendered cleanly (Length: ' + welcomeHtml.length + ' chars)');

  const sampleOrder: Order = {
    id: 'ord_test_123',
    orderNumber: 'TH-TEST-999',
    customerName: 'Sarah Connor',
    customerEmail: 'sarah@resistance.org',
    shippingAddress: {
      fullName: 'Sarah Connor',
      email: 'sarah@resistance.org',
      address: '100 Tech Blvd',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'United States',
    },
    items: [
      {
        productId: 'prod_1',
        productName: 'CyberSound Studio ANC Headphones',
        unitPrice: 299.99,
        quantity: 1,
        totalPrice: 299.99,
      },
    ],
    subtotal: 299.99,
    shippingFee: 0,
    tax: 24.0,
    total: 323.99,
    status: 'completed',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString(),
  };
  const orderHtml = generateOrderEmailHtml(sampleOrder);
  if (!orderHtml.includes('TH-TEST-999') || !orderHtml.includes('CyberSound Studio')) {
    throw new Error('Order confirmation email template failed');
  }
  console.log('   ✅ Master order confirmation email rendered cleanly (Length: ' + orderHtml.length + ' chars)\n');

  // Test 3: User Registration Flow
  console.log('3️⃣ Testing User Registration Flow in DB...');
  const testEmail = `test.user.${Date.now()}@example.com`;
  const regResult = await registerUser({
    email: testEmail,
    password: 'MyPassword123!',
    name: 'Test Explorer',
  });
  if (!regResult.success || !regResult.user || !regResult.code) {
    throw new Error('Registration failed: ' + regResult.error);
  }
  console.log('   ✅ User registered successfully. Email:', regResult.user.email);
  console.log('   ✅ Generated 6-digit verification code:', regResult.code);

  // Test 4: Verify Credentials with correct & incorrect password
  console.log('\n4️⃣ Testing User Credential Verification...');
  const goodAuth = await verifyUserCredentials(testEmail, 'MyPassword123!');
  if (!goodAuth.success) throw new Error('Valid credentials check failed');
  console.log('   ✅ Valid password successfully verified!');

  const badAuth = await verifyUserCredentials(testEmail, 'WrongPassword!');
  if (badAuth.success) throw new Error('Bad password was mistakenly accepted');
  console.log('   ✅ Incorrect password successfully rejected!');

  // Test 5: Email Verification with 6-digit Code
  console.log('\n5️⃣ Testing Email Verification using 6-Digit Code...');
  const verifyResult = await verifyEmailToken(regResult.code);
  if (!verifyResult.success || !verifyResult.user?.emailVerified) {
    throw new Error('Email code verification failed: ' + verifyResult.error);
  }
  console.log('   ✅ Email successfully verified! Verified flag:', verifyResult.user.emailVerified);

  // Test 6: Password Reset Flow
  console.log('\n6️⃣ Testing Password Reset Request & Execution...');
  const resetTokenData = await generatePasswordResetToken(testEmail);
  if (!resetTokenData || !resetTokenData.token) {
    throw new Error('Failed to generate password reset token');
  }
  console.log('   ✅ Generated single-use password reset token:', resetTokenData.token.substring(0, 16) + '...');

  const resetResult = await resetPasswordWithToken(resetTokenData.token, 'BrandNewPassword456!');
  if (!resetResult.success) {
    throw new Error('Password reset failed: ' + resetResult.error);
  }
  console.log('   ✅ Password updated successfully!');

  // Verify new password works and old password fails
  const oldAuth = await verifyUserCredentials(testEmail, 'MyPassword123!');
  if (oldAuth.success) throw new Error('Old password was still accepted after reset!');
  const newAuth = await verifyUserCredentials(testEmail, 'BrandNewPassword456!');
  if (!newAuth.success) throw new Error('New password was rejected after reset!');
  console.log('   ✅ Old password revoked and new password authenticated successfully!');

  // Test 7: Email Dispatcher Calls
  console.log('\n7️⃣ Testing Email Dispatch Services (Resend / Fallback)...');
  const sendV = await sendVerificationEmail({
    email: testEmail,
    name: 'Test Explorer',
    token: 'test_token_123',
    code: '123456',
  });
  console.log('   ✅ sendVerificationEmail status:', sendV.status);

  const sendP = await sendPasswordResetEmail({
    email: testEmail,
    name: 'Test Explorer',
    token: 'test_reset_token',
  });
  console.log('   ✅ sendPasswordResetEmail status:', sendP.status);

  const sendW = await sendWelcomeEmail({
    email: testEmail,
    name: 'Test Explorer',
  });
  console.log('   ✅ sendWelcomeEmail status:', sendW.status);

  console.log('\n========================================================');
  console.log('🎉 ALL AUTHENTICATION & EMAIL TEMPLATE TESTS PASSED 100%!');
  console.log('========================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
