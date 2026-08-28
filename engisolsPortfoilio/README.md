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

## Contact Form Variables

The contact and hero forms post to [Web3Forms](https://web3forms.com). Required in `.env`:

```env
VITE_WEB3FORMS_ACCESS_KEY=your_web3forms_access_key
```

The inbox submissions are delivered to is configured in the Web3Forms dashboard
against this access key — it is not set anywhere in this codebase.

## Build

```bash
npm run build
```

Build output includes sitemap and robots.txt generation via Vite plugin.
