# Psycholinguistics Benchmark Viewer

A Next.js web application for visualizing and analyzing psycholinguistics benchmark data. Data is automatically loaded from an Excel file included in the repository.

## 🚀 Features

- **Static JSON imports**: Data imported at build time for instant loading
- **High performance**: Zero runtime data fetching
- **Interactive table**: Filtering, sorting, and pagination
- **Responsive**: Works on mobile devices and desktop
- **Static export**: Optimized for GitHub Pages deployment
- **Automatic conversion**: Excel automatically converts to JSON on development




## 🛠️ Installation and Development

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/psycholinguistics_benchmark.git
cd psycholinguistics_benchmark

# Install dependencies
npm install

# Run in development mode
npm run dev
```

The application will be available at `http://localhost:3000`.

### Available Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Export static files
npm run export

# Convert Excel to JSON (for data updates)
npm run convert-excel

# Linting
npm run lint
```



## 🔄 Update Data

To update benchmark data:

1. **Edit XLSX**: Modify `public/benchmark_linguistics.xlsx` with new data
2. **Convert to JSON**: Run `npm run convert-excel` to generate the JSON file
3. **Deploy**: Push changes to update the live application



## 🚀 Deploy to GitHub Pages

### Automatic Configuration

1. **Fork/Clone** this repository
2. **Enable GitHub Pages**:
   - Go to Settings > Pages in your repository
   - Source: "GitHub Actions"
3. **Push changes** to the `main` branch
4. **Wait for deployment**: The workflow will run automatically

### Manual Configuration

```bash
# Build and export
npm run build

# Files will be in the 'out' folder
# Upload these files to your preferred hosting
```


## 📜 License

This project is under the MIT License. See the [LICENSE](LICENSE) file for more details.

