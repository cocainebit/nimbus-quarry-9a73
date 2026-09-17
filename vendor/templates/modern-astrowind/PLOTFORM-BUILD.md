Source: https://github.com/onwidget/astrowind
Pinned revision: 14e1a691f80548dcc36370847b1a02c0d0b12821

Install dependencies with `npm ci --ignore-scripts` (or `npm install --ignore-scripts` when the original uses pnpm), then `npm run build`. The build produces dist/. Plotform static output makes local asset/navigation references relative and includes an unconnected-form guard. Original fonts/images are self-hosted in the static distribution. The source remains suitable for further framework development.
