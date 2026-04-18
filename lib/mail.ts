import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.ENVIRONMENT==='development'?
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

export const sendNotificationEmail = async (
  email: string,
  title: string,
  message: string
) => {
  try {
    await resend.emails.send({
      from: "info@santaleague.it",
      to: email,
      subject: title,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#111;color:#fff;border-radius:8px">
          <h2 style="margin:0 0 8px;color:#fff">${title}</h2>
          <p style="margin:0;color:#ccc">${message}</p>
          <hr style="border:none;border-top:1px solid #333;margin:20px 0"/>
          <p style="margin:0;font-size:12px;color:#666">SantaLeague — non rispondere a questa email</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("sendNotificationEmail error:", error);
  }
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
