'use strict';

// Email sending via nodemailer. All SMTP settings come from .env (see config/env).
// To change provider (Brevo → Gmail → SendGrid …) you only edit the .env values.

const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

// Build (once) and return the nodemailer transport, or null if SMTP isn't set up.
function getTransporter() {
  if (!env.smtp.host || !env.smtp.user) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465, // 465 = SSL; 587 = STARTTLS
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

function isConfigured() {
  return !!getTransporter();
}

// Low-level send. Throws a clear error if email isn't configured.
async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) throw new Error('Email is not configured (missing SMTP settings in .env)');
  const from = `"${env.mailFromName}" <${env.mailFrom}>`;
  await t.sendMail({ from, to, subject, html, text });
}

// The OTP / verification-code email.
async function sendOtpEmail(to, code) {
  return sendMail({
    to,
    subject: `${code} is your StayMate verification code`,
    text: `Your StayMate verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2563eb">StayMate</h2>
        <p>Your verification code is:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:4px">${code}</p>
        <p style="color:#64748b">This code expires in 10 minutes. If you didn’t request it, ignore this email.</p>
      </div>`,
  });
}

// A simple welcome email after sign-up.
async function sendWelcomeEmail(to, name) {
  return sendMail({
    to,
    subject: 'Welcome to StayMate 🎉',
    text: `Hi ${name}, welcome to StayMate! Find your next stay, roommate, or rental space in minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#2563eb">Welcome to StayMate, ${name}! 🎉</h2>
        <p>Your account is ready. Find your next stay, roommate, or rental space in minutes.</p>
      </div>`,
  });
}

module.exports = { sendOtpEmail, sendWelcomeEmail, isConfigured };
