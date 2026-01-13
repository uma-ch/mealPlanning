import { Resend } from 'resend';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const magicLink = `${FRONTEND_URL}/auth/verify?token=${token}`;

  // If Resend is not configured, log to console (useful for local dev)
  if (!RESEND_API_KEY) {
    console.log('\n========================================');
    console.log('Magic Link for:', email);
    console.log('Link:', magicLink);
    console.log('========================================\n');
    return;
  }

  // Send email via Resend
  const resend = new Resend(RESEND_API_KEY);

  await resend.emails.send({
    from: 'Recipe Planner <email@uma.dev>',
    to: email,
    subject: 'Sign in to Recipe Planner',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Sign in to Recipe Planner</h2>
        <p>Click the link below to sign in to your account:</p>
        <p>
          <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #667eea; color: white; text-decoration: none; border-radius: 4px;">
            Sign In
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 15 minutes.
        </p>
        <p style="color: #666; font-size: 14px;">
          If you didn't request this email, you can safely ignore it.
        </p>
      </div>
    `,
    text: `Sign in to Recipe Planner\n\nClick this link to sign in: ${magicLink}\n\nThis link will expire in 15 minutes.`,
  });
}
