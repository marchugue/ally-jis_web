import { useState, useMemo, useEffect } from 'react';
import { 
  Mail, 
  KeyRound, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Smartphone, 
  Monitor, 
  Code2, 
  Eye, 
  ShieldCheck, 
  Zap, 
  Sliders, 
} from 'lucide-react';
import { notify } from '@/components/ui/sonner';
import { apiClient } from '@/api/client';

// Template Raw Code Strings with default Supabase variables
const CONFIRMATION_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Confirm Your Email Address - Ally-jis</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F7F4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .btn-primary:hover { background-color: #14542F !important; }
    @media (prefers-color-scheme: dark) {
      body, .email-bg { background-color: #0F172A !important; }
      .email-card { background-color: #1E293B !important; border-color: #334155 !important; }
      .text-title { color: #F8FAFC !important; }
      .text-body { color: #94A3B8 !important; }
      .otp-box { background-color: #0F172A !important; border-color: #334155 !important; color: #34D399 !important; }
      .info-box { background-color: #1E293B !important; border-color: #334155 !important; color: #CBD5E1 !important; }
      .footer-text { color: #64748B !important; }
      .divider { border-top-color: #334155 !important; }
    }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 16px 12px !important; }
      .content-cell { padding: 24px 18px !important; }
      .otp-code { font-size: 28px !important; letter-spacing: 6px !important; }
      .btn-primary { display: block !important; width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F4EF;" class="email-bg">
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    Verify your email address to complete registration on Ally-jis. Your confirmation code is {{ .Token }}.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #F7F4EF;" class="email-bg">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);" class="email-card email-container">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, {{BRAND_COLOR}} 0%, #2D8A4E 100%); padding: 32px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <div style="background: rgba(255, 255, 255, 0.2); width: 56px; height: 56px; border-radius: 14px; display: inline-block; text-align: center; line-height: 56px; color: #FFFFFF; font-weight: 800; font-size: 28px; font-family: 'Fraunces', Georgia, serif; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                      A
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <span style="color: #FFFFFF; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Fraunces', Georgia, serif;">
                      {{BRAND_NAME}}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 36px 32px 32px 32px;" class="content-cell">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <h1 class="text-title" style="margin: 0; color: #0F172A; font-size: 22px; font-weight: 700; line-height: 1.3; text-align: center; font-family: 'Fraunces', Georgia, serif;">
                      Verify Your Email Address
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <p class="text-body" style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6; text-align: center;">
                      Welcome to <strong>{{BRAND_NAME}}</strong>! Please click the button below to confirm your email address (<strong>{{ .Email }}</strong>) and activate your account.
                    </p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom: 28px;">
                    <a href="{{ .ConfirmationURL }}" class="btn-primary" target="_blank" style="background-color: {{BRAND_COLOR}}; color: #FFFFFF; display: inline-block; font-size: 15px; font-weight: 700; line-height: 48px; text-align: center; text-decoration: none; border-radius: 10px; padding: 0 32px; box-shadow: 0 4px 14px rgba(26, 107, 60, 0.25);">
                      Confirm Email Address &rarr;
                    </a>
                  </td>
                </tr>

                <!-- Notice -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div class="info-box" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 16px; text-align: center; font-size: 12px; color: #64748B; line-height: 1.5;">
                      Security Note: This link will expire in 24 hours. If you did not sign up for {{BRAND_NAME}}, you can safely ignore this email.
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom: 24px;">
                    <div class="divider" style="border-top: 1px solid #E2E8F0; width: 100%;"></div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <p class="text-body" style="margin: 0; color: #64748B; font-size: 12px; line-height: 1.6; text-align: left;">
                      Button not working? Copy & paste this link into your browser:<br>
                      <a href="{{ .ConfirmationURL }}" style="color: {{BRAND_COLOR}}; word-break: break-all; font-weight: 500;">
                        {{ .ConfirmationURL }}
                      </a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <span class="footer-text" style="color: #64748B; font-size: 12px; font-weight: 600;">
                      {{BRAND_NAME}} Platform
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="{{ .SiteURL }}/privacy" class="footer-text" style="color: #64748B; font-size: 12px; text-decoration: underline; margin: 0 8px;">Privacy Policy</a>
                    <span style="color: #CBD5E1;">•</span>
                    <a href="{{ .SiteURL }}/terms" class="footer-text" style="color: #64748B; font-size: 12px; text-decoration: underline; margin: 0 8px;">Terms of Service</a>
                    <span style="color: #CBD5E1;">•</span>
                    <a href="{{ .SiteURL }}/support" class="footer-text" style="color: #64748B; font-size: 12px; text-decoration: underline; margin: 0 8px;">Support Center</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p class="footer-text" style="margin: 0; color: #94A3B8; font-size: 11px; line-height: 1.4;">
                      Automated system security notification sent from {{BRAND_NAME}} Auth Services.<br>
                      &copy; 2026 {{BRAND_NAME}}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const RESET_PASSWORD_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Reset Your Password - Ally-jis Security</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F7F4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .btn-reset:hover { background-color: #C2410C !important; }
    @media (prefers-color-scheme: dark) {
      body, .email-bg { background-color: #0F172A !important; }
      .email-card { background-color: #1E293B !important; border-color: #334155 !important; }
      .text-title { color: #F8FAFC !important; }
      .text-body { color: #94A3B8 !important; }
      .otp-box { background-color: #0F172A !important; border-color: #EA580C !important; color: #FB923C !important; }
      .warning-box { background-color: #451A03 !important; border-color: #F97316 !important; color: #FFEDD5 !important; }
      .footer-text { color: #64748B !important; }
      .divider { border-top-color: #334155 !important; }
    }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 16px 12px !important; }
      .content-cell { padding: 24px 18px !important; }
      .otp-code { font-size: 28px !important; letter-spacing: 6px !important; }
      .btn-reset { display: block !important; width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F4EF;" class="email-bg">
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    Security Alert: Password reset request received for {{ .Email }}. Code: {{ .Token }}.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #F7F4EF;" class="email-bg">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);" class="email-card email-container">
          
          <!-- Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #EA580C 0%, #D97706 100%); padding: 32px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <div style="background: rgba(255, 255, 255, 0.2); width: 56px; height: 56px; border-radius: 14px; display: inline-block; text-align: center; line-height: 56px; color: #FFFFFF; font-weight: 800; font-size: 28px; font-family: 'Fraunces', Georgia, serif; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                      A
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <span style="color: #FFFFFF; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Fraunces', Georgia, serif;">
                      {{BRAND_NAME}} Security
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 36px 32px 32px 32px;" class="content-cell">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <h1 class="text-title" style="margin: 0; color: #0F172A; font-size: 22px; font-weight: 700; line-height: 1.3; text-align: center; font-family: 'Fraunces', Georgia, serif;">
                      Reset Your Password
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 24px;">
                    <p class="text-body" style="margin: 0; color: #475569; font-size: 15px; line-height: 1.6; text-align: center;">
                      We received a password reset request for your {{BRAND_NAME}} account associated with <strong>{{ .Email }}</strong>.
                    </p>
                  </td>
                </tr>

                <!-- Action Button -->
                <tr>
                  <td align="center" style="padding-bottom: 28px;">
                    <a href="{{ .ConfirmationURL }}" class="btn-reset" target="_blank" style="background-color: #EA580C; color: #FFFFFF; display: inline-block; font-size: 15px; font-weight: 700; line-height: 48px; text-align: center; text-decoration: none; border-radius: 10px; padding: 0 32px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.25);">
                      Reset Password Now &rarr;
                    </a>
                  </td>
                </tr>

                <!-- Security Warning -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div class="warning-box" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px 16px; text-align: center; font-size: 12px; color: #64748B; line-height: 1.5;">
                      Security Note: Valid for 1 hour. If you did not request a password reset, you can safely ignore this email or contact support at <a href="mailto:support@ally-jis.xyz" style="color: #64748B; font-weight: bold; text-decoration: underline;">support@ally-jis.xyz</a>.
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom: 24px;">
                    <div class="divider" style="border-top: 1px solid #E2E8F0; width: 100%;"></div>
                  </td>
                </tr>

                <tr>
                  <td>
                    <p class="text-body" style="margin: 0; color: #64748B; font-size: 12px; line-height: 1.6; text-align: left;">
                      Button not working? Copy & paste this link into your browser:<br>
                      <a href="{{ .ConfirmationURL }}" style="color: #EA580C; word-break: break-all; font-weight: 500;">
                        {{ .ConfirmationURL }}
                      </a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 24px 32px; border-top: 1px solid #E2E8F0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <span class="footer-text" style="color: #64748B; font-size: 12px; font-weight: 600;">
                      {{BRAND_NAME}} Security Operations
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p class="footer-text" style="margin: 0; color: #94A3B8; font-size: 11px; line-height: 1.4;">
                      Automated email sent following password recovery request for {{ .Email }}.<br>
                      &copy; 2026 {{BRAND_NAME}}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const MAGIC_LINK_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your Magic Sign-In Link - Ally-jis</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F7F4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .btn-magic:hover { background-color: #4F46E5 !important; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #0F172A !important; }
      .email-card { background-color: #1E293B !important; border-color: #334155 !important; }
      .text-title { color: #F8FAFC !important; }
      .text-body { color: #94A3B8 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F4EF;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden;" class="email-card">
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 32px 20px;">
              <div style="background: rgba(255,255,255,0.2); width: 56px; height: 56px; border-radius: 14px; display: inline-block; line-height: 56px; color: #FFF; font-size: 26px;">✨</div>
              <div style="color: #FFFFFF; font-size: 24px; font-weight: 700; margin-top: 10px;">{{BRAND_NAME}}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px;">
              <h1 class="text-title" style="margin: 0 0 12px 0; color: #0F172A; font-size: 22px; font-weight: 700; text-align: center;">Log In With Magic Link</h1>
              <p class="text-body" style="margin: 0 0 24px 0; color: #475569; font-size: 15px; text-align: center; line-height: 1.6;">
                Click below to sign in instantly to <strong>{{ .Email }}</strong> without entering a password.
              </p>
              <div align="center" style="margin-bottom: 28px;">
                <div style="background-color: #EEF2FF; border: 2px dashed #A5B4FC; border-radius: 12px; padding: 18px; text-align: center;">
                  <div style="color: #4338CA; font-size: 12px; font-weight: 700; text-transform: uppercase;">Sign-In Token</div>
                  <div style="color: #4F46E5; font-size: 32px; font-weight: 800; letter-spacing: 8px; font-family: monospace; margin: 6px 0;">{{ .Token }}</div>
                </div>
              </div>
              <div align="center" style="margin-bottom: 28px;">
                <a href="{{ .ConfirmationURL }}" class="btn-magic" style="background-color: #6366F1; color: #FFFFFF; display: inline-block; font-size: 15px; font-weight: 700; line-height: 48px; text-decoration: none; border-radius: 10px; padding: 0 32px;">
                  Log In To {{BRAND_NAME}} &rarr;
                </a>
              </div>
              <p class="text-body" style="margin: 0; color: #64748B; font-size: 12px; text-align: center;">⏱️ Link expires in 10 minutes.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

type TemplateKey = 'confirmation' | 'reset' | 'magic';
type ViewMode = 'desktop' | 'mobile';
type ActiveTab = 'preview' | 'code';

export default function EmailStudioPage() {
  const [activeTemplate, setActiveTemplate] = useState<TemplateKey>('confirmation');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
  const [copied, setCopied] = useState(false);

  // Variable Customizers with live configuration defaults
  const [testEmail, setTestEmail] = useState('student@chmsu.edu.ph');
  const [testToken, setTestToken] = useState('849204');
  const [testUrl, setTestUrl] = useState('https://www.ally-jis.xyz/auth/confirm?token=849204&type=signup');
  const [siteUrl, setSiteUrl] = useState(typeof window !== 'undefined' ? window.location.origin : 'https://www.ally-jis.xyz');
  const [brandName, setBrandName] = useState('Ally-jis');
  const [brandColor, setBrandColor] = useState('#1A6B3C');

  // Fetch real system configuration data on mount
  useEffect(() => {
    apiClient.adminGetSettings()
      .then((settings) => {
        if (settings?.platform_name) setBrandName(settings.platform_name);
      })
      .catch(() => {
        // Fallback to active system defaults if unauthenticated or offline
      });
  }, []);

  // Compute Raw Template Code (with Supabase placeholders preserved)
  const rawCode = useMemo(() => {
    let tpl = CONFIRMATION_TEMPLATE;
    if (activeTemplate === 'reset') tpl = RESET_PASSWORD_TEMPLATE;
    if (activeTemplate === 'magic') tpl = MAGIC_LINK_TEMPLATE;

    return tpl
      .replace(/{{BRAND_NAME}}/g, brandName)
      .replace(/{{BRAND_COLOR}}/g, brandColor);
  }, [activeTemplate, brandName, brandColor]);

  // Compute Live Rendered HTML (Replacing Supabase placeholders with sample test values)
  const renderedHtml = useMemo(() => {
    return rawCode
      .replace(/\{\{\s*\.Email\s*\}\}/g, testEmail)
      .replace(/\{\{\s*\.Token\s*\}\}/g, testToken)
      .replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, testUrl)
      .replace(/\{\{\s*\.SiteURL\s*\}\}/g, siteUrl);
  }, [rawCode, testEmail, testToken, testUrl, siteUrl]);

  // Handle Copy Raw Code for Supabase Console
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      notify.success('Copied Supabase HTML template to clipboard! Ready to paste into Supabase Console.');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      notify.error('Failed to copy to clipboard');
    }
  };

  // Handle Download .html File
  const handleDownload = () => {
    const filename = `${activeTemplate}_email_template.html`;
    const blob = new Blob([rawCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify.success(`Downloaded ${filename}`);
  };

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100 flex flex-col font-sans">

      {/* Main Layout Body */}
      <main className="flex-1 w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Settings & Controls (4 columns on lg) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Template Selection Card */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
              <Mail size={14} className="text-[#1A6B3C]" /> Select Email Template
            </h2>
            
            <div className="space-y-2">
              <button
                onClick={() => setActiveTemplate('confirmation')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  activeTemplate === 'confirmation'
                    ? 'border-[#1A6B3C] bg-emerald-50/70 dark:bg-emerald-950/30 text-[#1A6B3C] dark:text-emerald-400 shadow-xs'
                    : 'border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-bold">Email Confirmation</div>
                    <div className="text-[11px] font-normal text-gray-400 dark:text-gray-500">Signup verification & OTP</div>
                  </div>
                </div>
                {activeTemplate === 'confirmation' && <div className="w-2 h-2 rounded-full bg-[#1A6B3C]" />}
              </button>

              <button
                onClick={() => setActiveTemplate('reset')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  activeTemplate === 'reset'
                    ? 'border-orange-500 bg-orange-50/70 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <KeyRound size={16} className="text-orange-500" />
                  </div>
                  <div>
                    <div className="font-bold">Password Reset</div>
                    <div className="text-[11px] font-normal text-gray-400 dark:text-gray-500">Security recovery & OTP</div>
                  </div>
                </div>
                {activeTemplate === 'reset' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
              </button>

              <button
                onClick={() => setActiveTemplate('magic')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  activeTemplate === 'magic'
                    ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Sparkles size={16} className="text-indigo-500" />
                  </div>
                  <div>
                    <div className="font-bold">Magic Sign-in Link</div>
                    <div className="text-[11px] font-normal text-gray-400 dark:text-gray-500">Passwordless authentication</div>
                  </div>
                </div>
                {activeTemplate === 'magic' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
              </button>
            </div>
          </div>

          {/* Variable Customizer Panel */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <Sliders size={14} className="text-[#1A6B3C]" /> Test Variables & Styling
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">
                  Test Email <code className="text-[10px] text-emerald-600">{`{{ .Email }}`}</code>
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-[#1A6B3C]"
                />
              </div>

              <div>
                <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">
                  OTP Code Token <code className="text-[10px] text-emerald-600">{`{{ .Token }}`}</code>
                </label>
                <input
                  type="text"
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-mono outline-none focus:border-[#1A6B3C]"
                />
              </div>

              <div>
                <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">
                  Action Link URL <code className="text-[10px] text-emerald-600">{`{{ .ConfirmationURL }}`}</code>
                </label>
                <input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-[#1A6B3C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">Brand Name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white outline-none focus:border-[#1A6B3C]"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 dark:text-gray-400 mb-1 font-medium">Brand Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Info Badge */}
          <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 text-xs text-emerald-900 dark:text-emerald-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-400">
              <Zap size={16} /> Supabase Auth Placeholders
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
              Supabase Auth replaces <code className="bg-emerald-200/50 dark:bg-emerald-900/60 px-1 rounded">{`{{ .ConfirmationURL }}`}</code> and <code className="bg-emerald-200/50 dark:bg-emerald-900/60 px-1 rounded">{`{{ .Token }}`}</code> automatically when sending emails to your users.
            </p>
          </div>

        </div>

        {/* Right Side: Preview & Code Studio (8 columns on lg) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Control Bar & Viewport Switcher */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/10 p-2.5 flex items-center justify-between shadow-xs flex-wrap gap-2">
            
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Eye size={14} /> Preview
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Code2 size={14} /> HTML Code
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Screen Viewport Toggle (Desktop vs Mobile) */}
              {activeTab === 'preview' && (
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                  <button
                    onClick={() => setViewMode('desktop')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      viewMode === 'desktop'
                        ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Monitor size={14} /> Desktop
                  </button>
                  <button
                    onClick={() => setViewMode('mobile')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      viewMode === 'mobile'
                        ? 'bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Smartphone size={14} /> Mobile
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A6B3C] hover:bg-[#14542F] text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.97] cursor-pointer"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy HTML'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-all active:scale-[0.97] cursor-pointer"
              >
                <Download size={13} /> Download
              </button>
            </div>

          </div>

          {/* Main Viewport Display Area */}
          <div className="flex-1 bg-gray-200/60 dark:bg-[#070A10] rounded-2xl border border-gray-200 dark:border-white/10 p-4 md:p-6 flex justify-center items-start min-h-[640px] overflow-auto shadow-inner">
            
            {activeTab === 'preview' && (
              <div
                className={`transition-all duration-300 ${
                  viewMode === 'mobile'
                    ? 'w-[375px] bg-black p-3 rounded-[36px] shadow-2xl border-4 border-gray-800'
                    : 'w-full max-w-[640px] bg-transparent'
                }`}
              >
                {/* Mobile Device Notch Header */}
                {viewMode === 'mobile' && (
                  <div className="flex justify-between items-center px-4 py-2 text-white text-[10px] font-semibold">
                    <span>9:41</span>
                    <div className="w-16 h-3 bg-gray-800 rounded-full" />
                    <span>100% 🔋</span>
                  </div>
                )}

                <iframe
                  srcDoc={renderedHtml}
                  title="Email Preview"
                  className={`w-full border-0 bg-white transition-all ${
                    viewMode === 'mobile' ? 'h-[620px] rounded-[24px]' : 'h-[680px] rounded-2xl shadow-lg'
                  }`}
                />
              </div>
            )}

            {/* Source Code View */}
            {activeTab === 'code' && (
              <div className="w-full bg-[#0F172A] rounded-2xl p-4 border border-slate-800 overflow-auto font-mono text-xs text-emerald-400 space-y-4 max-h-[680px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-400 text-[11px]">
                    Standard HTML for Supabase Console
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-sans transition-all cursor-pointer"
                  >
                    <Copy size={12} /> Copy Code
                  </button>
                </div>
                <pre className="whitespace-pre-wrap break-all text-slate-200 text-[11px] leading-relaxed">
                  {rawCode}
                </pre>
              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}
