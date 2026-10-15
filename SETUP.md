# BIO Protocol Mini App — Setup Guide

## What this is
A Telegram Mini App (Web App) that opens inside Telegram when users tap ↗️ Withdraw.
No external browser needed. Telegram provides user identity automatically.

---

## STEP 1 — Register Mini App with BotFather

1. Open @BotFather in Telegram
2. Send /mybots → select your bot
3. Select "Bot Settings" → "Menu Button" → "Configure menu button"
4. Set URL to your Vercel URL (you'll get this after Step 3)
   OR skip for now and come back after deploying

Also do:
1. /newapp → select your bot
2. Give it a title: "BIO Withdrawal Portal"
3. Set the URL to your Vercel URL

---

## STEP 2 — Upload PHP files to cPanel

Upload all files from php-backend/ folder:

| Local file                    | Upload to cPanel                        |
|-------------------------------|-----------------------------------------|
| me_by_id.php                  | public_html/api/me_by_id.php            |
| deposit_by_id.php             | public_html/api/deposit_by_id.php       |
| withdraw_by_id.php            | public_html/api/withdraw_by_id.php      |
| withdrawals_by_id.php         | public_html/api/withdrawals_by_id.php   |

---

## STEP 3 — Deploy to Vercel

1. Push bio-miniapp/ folder to GitHub (private repo)
2. Go to vercel.com → New Project → Import repo
3. Add Environment Variables:

| Variable                 | Value                                    |
|--------------------------|------------------------------------------|
| NEXT_PUBLIC_API_BASE     | https://bioprotocol.in                   |
| ADMIN_PASSWORD           | your_strong_admin_password               |
| BOT_TOKEN                | your_telegram_bot_token                  |
| PHP_SYNC_SECRET          | same as BOT_TOKEN (or set a separate one)|

4. Click Deploy → copy your Vercel URL

---

## STEP 4 — Update bot

Replace balance.py in your bot folder with bot_balance_update.py
(rename it to balance.py)

Then update the MINI_APP_URL at the top:
  MINI_APP_URL = "https://your-actual-vercel-url.vercel.app"

Restart your bot on Render.

---

## STEP 5 — Tell BotFather the Mini App URL

1. @BotFather → /mybots → your bot → Bot Settings → Menu Button
2. Set URL to your Vercel URL
3. Set button text to "Open Portal" (optional)

---

## STEP 6 — Test

1. Open your bot in Telegram
2. Tap ↗️ Withdraw
3. Tap "Open Withdrawal Portal" button
4. Mini App opens inside Telegram showing your balance
5. Test withdraw flow, deposit flow, history

Admin panel: https://your-vercel-url.vercel.app/admin

---

## Local development

cd bio-miniapp
npm install
npm run dev

Since Telegram WebApp.initData won't be available locally,
the app automatically uses a mock dev user (user_id: 123456789).
Make sure that user exists in your PHP database first.

To test with real Telegram data locally, use ngrok:
  npx ngrok http 3000
Then set that ngrok URL as the Mini App URL in BotFather temporarily.
