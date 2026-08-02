import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';

export type SmtpEncryption = 'none' | 'starttls' | 'tls';

export type SmtpTransportConfig = {
  host: string;
  port: number;
  encryption: SmtpEncryption;
  username: string | null;
  password: string | null;
  fromAddress: string;
  fromName: string | null;
};

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function buildTransportOptions(config: SmtpTransportConfig): SMTPTransport.Options {
  const secure = config.encryption === 'tls';
  const requireTLS = config.encryption === 'starttls';
  const options: SMTPTransport.Options = {
    host: config.host,
    port: config.port,
    secure,
    requireTLS: requireTLS || undefined,
    tls: config.encryption === 'none' ? { rejectUnauthorized: false } : undefined,
  };
  if (config.username != null && config.username.trim() !== '') {
    options.auth = {
      user: config.username,
      pass: config.password ?? '',
    };
  }
  return options;
}

function formatFrom(config: SmtpTransportConfig): string {
  const name = config.fromName?.trim();
  if (name) return `${name} <${config.fromAddress}>`;
  return config.fromAddress;
}

/**
 * Sends one email via SMTP. Throws on transport/delivery failure.
 */
export async function sendSmtpMail(
  config: SmtpTransportConfig,
  mail: SendMailInput
): Promise<void> {
  const transporter = nodemailer.createTransport(buildTransportOptions(config));
  try {
    await transporter.sendMail({
      from: formatFrom(config),
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  } finally {
    transporter.close();
  }
}
