// Re-export from unified high-reliability email service
export {
  sendOrderConfirmationEmail,
  generateOrderEmailHtml,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendUniversalEmail,
} from './email';

export const isResendConfigured = (): boolean => {
  return Boolean(process.env.RESEND_API_KEY);
};
