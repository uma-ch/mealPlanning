import nodemailer from 'nodemailer';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const magicLink = `${FRONTEND_URL}/auth/verify?token=${token}`;

  // Check if SMTP is configured
  const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  // If SMTP not configured, log to console (works in dev and prod)
  if (!smtpConfigured) {
    console.log('\n========================================');
    console.log('Magic Link for:', email);
    console.log('Link:', magicLink);
    console.log('========================================\n');
    return;
  }

  // SMTP is configured, send actual email
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@recipeplanner.com',
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
