# Pricing Calculator

A React-based pricing calculator for Virtual Engine Room Bookkeeping services.

## Features

- Multi-client pricing calculations
- Tier-based pricing (Gold, Silver, Bronze)
- CSV export functionality
- Webhook integration for data submission
- Responsive design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pricing-calculator.git
cd pricing-calculator
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
npm run build
npm start
```

## Deployment

This project is optimized for deployment on Vercel. Simply connect your GitHub repository to Vercel and it will automatically deploy.

## Project Structure

```
pricing-calculator/
├── components/
│   └── PricingCalculator.js
├── pages/
│   ├── _app.js
│   └── index.js
├── styles/
│   └── globals.css
├── package.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Technologies Used

- Next.js 14
- React 18
- Tailwind CSS
- PostCSS
- Autoprefixer

## License

MIT License