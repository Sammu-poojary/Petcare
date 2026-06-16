# Supabase Email Verification Setup

If verification emails are not being sent to users after registration, follow these steps in your **Supabase Dashboard**:

## 1. Enable Email Confirmations

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers** → **Email**
4. Enable **"Confirm email"** (toggle ON)

## 2. Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add your site URLs to **Redirect URLs**:
   - For development: `http://localhost:3000/login`
   - For production: `https://yourdomain.com/login`

## 3. Configure Custom SMTP (Recommended for Production)

Supabase's built-in email has rate limits. For reliable delivery:

1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Configure your email provider (e.g., SendGrid, Mailgun, Resend, or Gmail)

### Example: Gmail SMTP
- **Host:** smtp.gmail.com
- **Port:** 587
- **Username:** your-email@gmail.com
- **Password:** App Password (not your regular password - enable 2FA and create one in Google Account settings)

### Example: Resend (Free tier available)
- Sign up at [resend.com](https://resend.com)
- Get API key and use Resend's SMTP credentials

## 4. Customize Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup**
3. Customize the subject and body
4. Ensure `{{ .ConfirmationURL }}` is in the template

## 5. Check Logs if Emails Still Don't Send

1. Go to **Logs** → **Logs Explorer**
2. Filter by **Auth** service
3. Search for "email" or "signup" to see any errors

## Resend Verification Email (In App)

Users can now:
- **After registration:** Click "Resend verification email" on the success screen
- **On login:** If they get "email not confirmed", a "Resend verification email" button appears
