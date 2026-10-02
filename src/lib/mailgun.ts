// Re-export from unified high-reliability email service
export {
  sendOrderConfirmationEmail,
  generateOrderEmailHtml,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendUniversalEmail,
} from './email';

export const isMailgunConfigured = (): boolean => {
  return Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
};
