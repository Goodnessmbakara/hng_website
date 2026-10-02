import fs from 'fs';
import path from 'path';

// Manually parse .env.local if not already in process.env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

import { sendVerificationEmail, sendWelcomeEmail } from '../src/lib/email';

async function main() {
  const recipient = 'amicablembakara50@gmail.com';
  console.log(`🚀 Dispatching sleek master-designer email to: ${recipient}`);
  console.log(`Using RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'Present' : 'Missing'}`);
  console.log(`Using RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL}`);

  // 1. Send the sleek Verification Email with code
  console.log('\n📤 Sending Master Designer Email Verification...');
  const verifyResult = await sendVerificationEmail({
    email: recipient,
    name: 'Amicable Mbakara',
    token: 'th_verify_live_789456123',
    code: '749102',
  });

  console.log('Result:', verifyResult);

  if (verifyResult.success && verifyResult.status === 'sent') {
    console.log(`\n🎉 Success! Email sent via Resend API to ${recipient}!`);
    console.log(`Message ID: ${verifyResult.messageId}`);
  } else {
    console.log('\nStatus:', verifyResult.status, 'Error:', verifyResult.error);
  }
}

main().catch(console.error);
