import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.ENVIRONMENT==='production'?
    'http://localhost:3000'
    : process.env.NEXT_PUBLIC_APP_URL;

export const sendTwoFactorTokenEmail = async (
  email: string,
  token: string
) => {
  await resend.emails.send({
    from: "info@santaleague.it",
    to: email,
    subject: "2FA Code",
    html: `<p>Your 2FA code: ${token}</p>`
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
) => {
  const resetLink = `${domain}/auth/new-password?token=${token}`

  await resend.emails.send({
    from: "info@santaleague.it",
    to: email,
    subject: "Reset your password",
    html: `<p>Click <a href="${resetLink}">here</a> to reset password.</p>`
  });
};

export const sendVerificationEmail = async (
  email: string, 
  token: string
) => {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`;

  try {
    const upp = await resend.emails.send({
      from: "info@santaleague.it",
      to: email,
      subject: "Confirm your email",
      html: `<p>Click <a href="${confirmLink}">here</a> to confirm email.</p>`
    });
    console.log(upp)
  }catch (error) {
    console.error(error);
  }

};
