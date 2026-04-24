# ENGISOLS Portfolio (React + Vite)

Modern ENGISOLS portfolio rebuilt in React with a structured component architecture, custom CSS styling, animated sections, SEO metadata, and EmailJS contact integration.

## Features

- Multi-section portfolio structure (hero, clients, about, services, team, reviews, contact, footer)
- Hero form fields aligned with Contact Us form fields
- Pricing section removed
- Custom CSS design system in `src/index.css`
- SEO improvements using `react-helmet-async` + `vite-plugin-sitemap`
- EmailJS integration wired with your IDs:
	- `service_iyr2vci`
	- `template_q76s32a`

## Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env` from `.env.example` and set your EmailJS public key

```bash
cp .env.example .env
```

3. Start development server

```bash
npm run dev
```

## EmailJS Variables

Required in `.env`:

```env
VITE_EMAILJS_SERVICE_ID=service_iyr2vci
VITE_EMAILJS_TEMPLATE_ID=template_q76s32a
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
VITE_CONTACT_TO_EMAIL=hello@engisols.com
```

## Build

```bash
npm run build
```

Build output includes sitemap and robots.txt generation via Vite plugin.
