Source: https://github.com/markhorn-dev/astro-sphere
Pinned revision: f7e3a40f20e1267d7fbbb7b6dd868df1845e1d82

Install dependencies with `npm ci --ignore-scripts` (or `npm install --ignore-scripts` when the original uses pnpm), then `npm run build`. The build produces dist/. Plotform static output makes local asset/navigation references relative and includes an unconnected-form guard. Original fonts/images are self-hosted in the static distribution. The source remains suitable for further framework development.
