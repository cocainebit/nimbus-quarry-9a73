Source: https://github.com/mhyfritz/astro-landing-page
Pinned revision: 987617a50863d31bb865ee531391a191d74a878a

Install dependencies with `npm ci --ignore-scripts` (or `npm install --ignore-scripts` when the original uses pnpm), then `npm run build`. The build produces dist/. Plotform static output makes local asset/navigation references relative and includes an unconnected-form guard. Original fonts/images are self-hosted in the static distribution. The source remains suitable for further framework development.
