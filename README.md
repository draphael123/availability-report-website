# Oncehub Availability Report

A Next.js web application that displays and analyzes data from a Google Sheet. Built with TypeScript, Tailwind CSS, shadcn/ui, TanStack Table, and Recharts.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Oncehub+Availability+Report)

## Features

- **Data Table**: Sortable, paginated table with column visibility controls
- **Filtering**: Global search, category/location dropdowns, numeric range filters, error-only toggle
- **Row Details**: Click any row to see full details in a slide-out drawer
- **Charts**: Bar charts showing row counts and average days out by category
- **Dual Data Source**: Supports Google Sheets API (private sheets) or CSV export (public sheets)
- **Caching**: Server-side caching to reduce API calls
- **Responsive**: Works on desktop and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix primitives)
- **Data Table**: TanStack Table
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd oncehub-availability-report
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
# Copy the example and fill in your values
cp .env.example .env.local
```

4. Configure environment variables (see [Configuration](#configuration) below)

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

Create a `.env.local` file with the following variables:

```env
# Google Sheets API Key (optional - enables private sheet access)
GOOGLE_SHEETS_API_KEY=

# Sheet configuration (defaults provided)
SHEET_ID=1vOXJEegJHJizatcXErv_dOLuWCiz_z8fGZasSDde2tc
SHEET_GID=766458838
```

### Data Source Options

The app supports two methods for fetching data:

#### Option A: Google Sheets API (Recommended for Private Sheets)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key and add it to `.env.local` as `GOOGLE_SHEETS_API_KEY`
6. (Optional) Restrict the API key to only the Sheets API for security

#### Option B: CSV Export (Public Sheets Only)

If no API key is provided, the app falls back to fetching via Google's CSV export URL. This requires the sheet to be:

1. Shared as **"Anyone with the link can view"**
2. To set this:
   - Open your Google Sheet
   - Click **Share** (top right)
   - Under "General access", select **"Anyone with the link"**
   - Set role to **"Viewer"**
   - Click **Done**

## Deploying to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

### Manual Deploy

1. Push your code to GitHub/GitLab/Bitbucket

2. Go to [vercel.com](https://vercel.com) and import your repository

3. Add environment variables in Vercel dashboard:
   - Go to **Settings** → **Environment Variables**
   - Add `GOOGLE_SHEETS_API_KEY` (if using API method)
   - Add `SHEET_ID` and `SHEET_GID` if different from defaults

4. Deploy!

## Project Structure

```
├── app/
│   ├── api/
│   │   └── sheet/
│   │       └── route.ts      # API endpoint for fetching sheet data
│   ├── globals.css           # Global styles and CSS variables
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main dashboard page
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── charts.tsx            # Recharts visualizations
│   ├── data-table.tsx        # TanStack Table implementation
│   ├── error-state.tsx       # Error display component
│   ├── filters.tsx           # Filter controls
│   ├── loading-skeleton.tsx  # Loading state
│   └── row-drawer.tsx        # Row detail drawer
├── lib/
│   ├── sheet-fetcher.ts      # Google Sheets data fetching
│   ├── sheet-parser.ts       # Data parsing and normalization
│   ├── types.ts              # TypeScript type definitions
│   └── utils.ts              # Utility functions
├── .env.example              # Example environment file
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Troubleshooting

### "Unable to Load Data" Error

1. **API Key Issues**:
   - Verify API key is valid and not expired
   - Check that Google Sheets API is enabled in Cloud Console
   - Ensure API key has no IP restrictions blocking your server

2. **Sheet Access Issues**:
   - Verify Sheet ID is correct (from URL: `docs.google.com/spreadsheets/d/{SHEET_ID}/...`)
   - Verify GID is correct (from URL: `...gid={GID}`)
   - For CSV method: ensure sheet is publicly shared

3. **Network Issues**:
   - Check your internet connection
   - Verify firewall isn't blocking Google APIs

### Data Not Updating

The app caches data for 60 seconds. Click **Refresh** to force a fresh fetch.

### Missing Columns

Column names are derived from the sheet's header row. Ensure:
- First row contains column headers
- Headers are not empty
- Headers don't contain only whitespace

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Adding New Filters

To add a new filter:

1. Update `FilterState` type in `lib/types.ts`
2. Add filter UI in `components/filters.tsx`
3. Add filter logic in `app/page.tsx` in the `filteredData` useMemo

## Adding New Charts

To add new visualizations:

1. Update `components/charts.tsx`
2. Add new data calculation in `lib/sheet-parser.ts` if needed
3. The filtered data is passed to charts automatically

## License

MIT

