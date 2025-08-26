# Psycholinguistics Benchmark Viewer

A Next.js web application for visualizing and analyzing psycholinguistics benchmark data. Data is automatically loaded from an Excel file included in the repository.

## 🚀 Features

- **Automatic data loading**: Automatically reads Excel file from repository
- **Interactive table**: Filtering, sorting, and pagination
- **Responsive**: Works on mobile devices and desktop


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

# Linting
npm run lint
```



## 🔄 Update Data

To update benchmark data:

1. **Edit XLSX**: Modify `public/benchmark_data.xlsx` with new data
2. **Deploy**: Changes will be automatically visible when reloading the application



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

