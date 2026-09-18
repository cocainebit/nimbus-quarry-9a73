Source: https://github.com/CloudCannon/treat-jekyll-template
Pinned revision: 105333c37b8d342caa238f984cf8c2008e702f82
Licence: MIT (the upstream LICENSE file is kept beside this note)

Build: `bundle install` then `bundle exec jekyll build` produces `_site`.
Plotform makes the built output's local references relative and adds an
unconnected-form guard, then publishes it under public/templates/.

Changes made to the upstream source before building:
- Google Analytics block removed from the layout.
- Disqus comment embed removed.
- Google Fonts stylesheet replaced with self-hosted woff2 files.
- Remote demo photographs (source.unsplash.com, unsplash.it, placehold.it, placekitten.com, placebear.com, fillmurray.com) replaced with placeholder artwork drawn for this repository.
- Bundled photographs removed and replaced with placeholder artwork drawn for this repository: images/author.jpg
- A visible note marks the demonstration content as illustrative.
- The Pinterest hover widget and its jQuery dependency were removed; anchor scrolling now uses CSS scroll-behavior.
