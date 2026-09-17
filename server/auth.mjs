import { betterAuth } from "better-auth";
import nodemailer from "nodemailer";
export function createAuth(
  pool,
  {
    origin = process.env.APP_ORIGIN,
    secret = process.env.AUTH_SECRET,
    production = process.env.NODE_ENV === "production",
    mailer,
  } = {},
) {
  if (!origin || !secret || secret.length < 32)
    throw Error(
      "Set APP_ORIGIN and a random AUTH_SECRET of at least 32 characters.",
    );
  if (
    production &&
    (!origin.startsWith("https://") || (!process.env.SMTP_HOST && !mailer))
  )
    throw Error("Production requires HTTPS APP_ORIGIN and configured SMTP.");
  const transport =
    mailer ||
    nodemailer.createTransport({
      host: process.env.SMTP_HOST || "127.0.0.1",
      port: Number(process.env.SMTP_PORT || 1025),
      secure: process.env.SMTP_SECURE === "true",
      ...(process.env.SMTP_USER
        ? {
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD,
            },
          }
        : {}),
    });
  const send = async (to, subject, url) => {
    await transport.sendMail({
      from: process.env.MAIL_FROM || "Plotform <studio@localhost.test>",
      to,
      subject,
      text: `${subject}\n\n${url}\n\nIf you did not request this, ignore this email.`,
    });
  };
  const make = (runtime) =>
    betterAuth({
      database: pool,
      secret: runtime ? `${secret}-runtime` : secret,
      baseURL: origin,
      basePath: runtime ? "/api/member-auth" : "/api/auth",
      trustedOrigins: [origin],
      user: { modelName: runtime ? "member_user" : "studio_user" },
      session: {
        modelName: runtime ? "member_session" : "studio_session",
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
      },
      account: { modelName: runtime ? "member_account" : "studio_account" },
      verification: {
        modelName: runtime ? "member_verification" : "studio_verification",
      },
      advanced: {
        cookiePrefix: runtime ? "site-member" : "studio",
        useSecureCookies: production,
        ipAddress: { ipAddressHeaders: ["x-studio-client-ip"] },
      },
      emailAndPassword: {
        enabled: true,
        minPasswordLength: 12,
        requireEmailVerification: production,
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: async ({ user, url }) =>
          send(user.email, "Reset your password", url),
      },
      emailVerification: {
        sendOnSignUp: production,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) =>
          send(user.email, "Verify your email", url),
      },
      rateLimit: {
        enabled: true,
        window: 60,
        max: 30,
        storage: "database",
        modelName: runtime ? "member_rate_limit" : "studio_rate_limit",
      },
    });
  return { studio: make(false), member: make(true) };
}
