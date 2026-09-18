Source: https://github.com/CloudCannon/author-jekyll-template
Pinned revision: 907e409613a3b18daf3c36f48b0a9c52afac2a74
Licence: MIT (the upstream LICENSE file is kept beside this note)

Build: `bundle install` then `bundle exec jekyll build` produces `_site`.
Plotform makes the built output's local references relative and adds an
unconnected-form guard, then publishes it under public/templates/.

Changes made to the upstream source before building:
- Google Analytics block removed from the layout.
- Disqus comment embed removed.
- Google Fonts stylesheet replaced with self-hosted woff2 files.
- Remote demo photographs (source.unsplash.com, unsplash.it, placehold.it, placekitten.com, placebear.com, fillmurray.com) replaced with placeholder artwork drawn for this repository.
- Bundled photographs removed and replaced with placeholder artwork drawn for this repository: images/1.jpg, images/10.jpg, images/11.jpg, images/12.jpg, images/2.jpg, images/3.jpg, images/4.jpg, images/5.jpg, images/6.jpg, images/7.jpg, images/8.jpg, images/9.jpg, images/cover.jpg
- jQuery served from the template instead of a CDN.
- A visible note marks the demonstration content as illustrative.
- The 3D book cover was given a smaller size below 560px so it no longer overflows a phone screen, and the dead /full.html links were corrected.
