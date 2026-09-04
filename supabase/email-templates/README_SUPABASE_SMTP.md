# Supabase SMTP Setup Guide (All Dashboard UI Versions)

This guide covers setting up **Resend** (or custom SMTP) in Supabase across all Supabase Dashboard UI versions.

---

## 🔍 Path A: New Supabase Dashboard Layout (Current)

1. Click ⚙️ **Project Settings** (Gear icon at the bottom of the left sidebar).
2. Under **Configuration**, click **Authentication**.
3. Scroll down to the **SMTP Settings** (or **SMTP Provider**) section.
4. Toggle **Enable Custom SMTP** to **ON**.

---

## 🔍 Path B: Classic Supabase Dashboard Layout

1. Click 👤 **Authentication** in the main left sidebar.
2. Click **Settings** or **Providers** in the top tab bar.
3. Scroll down to **SMTP Settings**.
4. Toggle **Enable Custom SMTP** to **ON**.

---

## 📋 Resend SMTP Parameter Values

Enter these exact credentials:

- **Sender Email**: `onboarding@resend.dev` *(If testing without custom domain)* **OR** `noreply@yourdomain.com` *(If domain is verified in Resend)*
- **Sender Name**: `Ally-jis`
- **Host**: `smtp.resend.com`
- **Port**: `465` (SSL/TLS) or `587` (STARTTLS)
- **Minimum TLS Version**: `TLSv1.2`
- **Username**: `resend` *(Must be literally the exact word `resend`)*
- **Password**: `<YOUR_RESEND_API_KEY>` *(e.g. re_123456789...)*

---

## 📄 Pasting Email Templates in Supabase

1. Navigate to **Authentication** → **Email Templates**.
2. For Signup: Select **Confirm signup** → Paste content from `email_confirmation.html`.
3. For Password Reset: Select **Reset password** → Paste content from `password_reset.html`.
4. Click **Save**.
