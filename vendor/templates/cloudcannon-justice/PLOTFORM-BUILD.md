Source: https://github.com/CloudCannon/justice-jekyll-template
Pinned revision: 3bc0b76056622f8a66eaad153a3bddadc6ff8a89
Licence: MIT (the upstream LICENSE file is kept beside this note)

Build: `bundle install` then `bundle exec jekyll build` produces `_site`.
Plotform makes the built output's local references relative and adds an
unconnected-form guard, then publishes it under public/templates/.

Changes made to the upstream source before building:
- Google Analytics block removed from the layout.
- Disqus comment embed removed.
- Google Maps embed replaced with a drawn map panel; the address text is kept.
- Google Fonts stylesheet replaced with self-hosted woff2 files.
- Remote demo photographs (source.unsplash.com, unsplash.it, placehold.it, placekitten.com, placebear.com, fillmurray.com) replaced with placeholder artwork drawn for this repository.
- Bundled photographs removed and replaced with placeholder artwork drawn for this repository: uploads/building.jpg
- A visible note marks the demonstration content as illustrative.
