# Invogen

A minimal, modern invoice generator built with React and TypeScript. Create professional invoices, export to PDF/image, and share via email or WhatsApp.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)

## Features

- **Invoice Management** - Create, edit, duplicate, and track invoice status (draft/sent/paid)
- **Live Preview** - Real-time invoice preview as you type
- **Multiple Export Options** - Download as PDF, PNG image, or print directly
- **Share Instantly** - Send via email or WhatsApp with pre-filled message
- **Saved Clients** - Auto-save client info for quick reuse
- **Custom Branding** - Add your logo and choose accent colors
- **QR Code** - Optional QR code for payment details
- **Dark Mode** - Light and dark theme support
- **Offline Ready** - All data stored locally in browser

## Tech Stack

- React 19
- TypeScript
- Tailwind CSS v4
- Vite
- html2pdf.js
- html2canvas
- qrcode.react

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/invogen.git
cd invogen

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. Fill in your business details in **Settings**
2. Create a new invoice in the **Editor**
3. Add line items with descriptions, quantities, and rates
4. Preview your invoice in real-time
5. Export as PDF, image, or share directly

## Screenshots

### Editor View
Create and edit invoices with live preview

### Invoice Preview
Professional invoice layout with customizable branding

### Settings
Configure defaults, saved clients, and branding options

## Data Storage

All data is stored in your browser's localStorage:
- Invoices and history
- Saved clients
- Item templates
- Settings and preferences

Export your data anytime from **Settings > Data > Export**.

## License

MIT
