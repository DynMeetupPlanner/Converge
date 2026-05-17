import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function sendPasswordResetOtpEmail({ to, otp, name, expiresMinutes = 10 }) {
  if (!resend) {
    throw new Error('RESEND_API_KEY is missing');
  }

  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const safeName = escapeHtml(name || 'there');
  const safeOtp = escapeHtml(otp);
  const safeExpiry = escapeHtml(expiresMinutes);

  const { error } = await resend.emails.send({
    from,
    to,
    subject: 'Your Converge password reset code',
    html: `
      <p>Hi ${safeName},</p>
      <p>Your Converge password reset code is:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:4px;">${safeOtp}</p>
      <p>This code expires in ${safeExpiry} minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message || 'unknown error'}`);
  }
}
