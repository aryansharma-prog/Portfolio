<div align="center">

# Aryan Sharma — Developer Portfolio & API

**Production-Grade Developer Portfolio with Node.js/Express Contact Pipeline & Nodemailer Service**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-portfolio.vercel.app-00f2fe?style=flat-square&logo=vercel&logoColor=white)](https://portfolio-amber-rho-jwa3w6ztpg.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-Node.js%20%2B%20Express%20%2B%20MongoDB%20%2B%20Vanilla%20JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://github.com/aryansharma-prog/Portfolio)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

</div>

---

## 📌 Project Description

A production-ready, high-performance personal developer portfolio and backend engineering showcase built for Aryan Sharma (SDE Aspirant & MERN Stack Developer). Features a responsive, glassmorphic UI, dynamic theme persistence, an interactive multi-agent case study modal, and a secure backend contact pipeline that validates inputs, stores inquiries in MongoDB, dispatches real-time email notifications with Gmail `Reply-To` support, and includes a protected Admin Messages Dashboard.

---

## ⚡ Key Highlights

- 🚀 **Full-Stack Pipeline**: Native HTML5/CSS3/Vanilla JS frontend backed by a secure Node.js/Express API gateway.
- 📬 **Reliable Contact System**: `POST /api/contact` validates requests, sanitizes XSS inputs, persists inquiries to MongoDB, and dispatches styled emails via Nodemailer with direct visitor `Reply-To`.
- 🛡️ **Built-in Security & Anti-Spam**: Rate limiting (5 submissions / 15 min), invisible honeypot trap (`_gotcha`), Helmet security headers, and CORS protection.
- 🔐 **Protected Admin Portal**: Authenticated dashboard (`/api/admin/messages`) protected by `ADMIN_API_KEY` to search, filter by status (`unread`, `read`, `replied`, `archived`), and manage inquiries.
- 🌓 **Zero-Friction Theming**: Sub-second dark/light mode switching with `localStorage` token caching.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    Visitor([Visitor]) -->|Contact Form| Client[Client Validation]
    Client -->|POST /api/contact| Express[Express API Server]
    Express --> RateLimit[Rate Limiter & Spam Trap]
    RateLimit --> DB[(MongoDB Store)]
    DB --> EmailService[Nodemailer Transporter]
    EmailService -->|Direct Reply-To| Inbox[Aryan's Gmail Inbox]
    
    AdminUser([Admin]) -->|x-admin-key| AdminAPI[/api/admin/messages]
    AdminAPI --> DB
```

---

## 🚀 Easy Deployment Guide

### Option 1: Deploy to Vercel (Recommended)

1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Configure the following **Environment Variables**:
   - `CONTACT_EMAIL`: `aryan21sharma04@gmail.com`
   - `EMAIL_FROM`: `"Portfolio Notifications" <aryan21sharma04@gmail.com>`
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_SECURE`: `false`
   - `SMTP_USER`: `aryan21sharma04@gmail.com`
   - `SMTP_PASS`: `your_16_char_gmail_app_password`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster.mongodb.net/portfolio`
   - `ADMIN_API_KEY`: `your_strong_admin_key`
4. Click **Deploy**. Vercel will automatically serve the frontend and route `/api/*` to serverless functions via `vercel.json`.

---

### Option 2: Deploy to Render / Railway / DigitalOcean

1. Create a new **Web Service** pointing to your repository.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Add the environment variables listed in `.env.example`.

---

## 💻 Local Development

```bash
# 1. Clone the repository
git clone https://github.com/aryansharma-prog/Portfolio.git
cd Portfolio

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start local development server
npm run dev

# 5. Run automated test suite
npm test
```

*Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## 📋 Environment Variables Reference

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Local server port | `3000` |
| `NODE_ENV` | Environment mode | `production` / `development` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb+srv://...` |
| `CONTACT_EMAIL` | Inbox receiving notifications | `aryan21sharma04@gmail.com` |
| `EMAIL_FROM` | Sender address header | `"Portfolio" <aryan21sharma04@gmail.com>` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `aryan21sharma04@gmail.com` |
| `SMTP_PASS` | Gmail App Password (16 chars) | `abcd efgh ijkl mnop` |
| `ADMIN_API_KEY` | Key protecting admin endpoints | `secret_admin_key` |
| `ALLOWED_ORIGINS`| CORS allowed domains | `https://aryansharma.dev` |

---

## 👨‍💻 Author

**Aryan Sharma**  
- Portfolio: [aryansharma.dev](https://portfolio-amber-rho-jwa3w6ztpg.vercel.app)  
- GitHub: [@aryansharma-prog](https://github.com/aryansharma-prog)  
- LinkedIn: [Aryan Sharma](https://linkedin.com/in/aryan-sharma-b9a4242a3)
