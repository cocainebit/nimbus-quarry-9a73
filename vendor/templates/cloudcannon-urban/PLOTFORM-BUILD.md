Source: https://github.com/CloudCannon/urban-jekyll-template
Pinned revision: 5119f52c23fe853b12da35684017506e6eb91e5c
Licence: MIT (the upstream LICENSE file is kept beside this note)

Build: `bundle install` then `bundle exec jekyll build` produces `_site`.
Plotform makes the built output's local references relative and adds an
unconnected-form guard, then publishes it under public/templates/.

Changes made to the upstream source before building:
- Google Analytics block removed from the layout.
- Disqus comment embed removed.
- Google Maps embed replaced with a drawn map panel; the address text is kept.
- Remote demo photographs (source.unsplash.com, unsplash.it, placehold.it, placekitten.com, placebear.com, fillmurray.com) replaced with placeholder artwork drawn for this repository.
- Bundled photographs removed and replaced with placeholder artwork drawn for this repository: images/clients/cause.jpg, images/clients/edition.png, images/clients/frisco.jpg, images/clients/hydra.png, images/clients/justice.jpg, images/clients/malt.jpg, images/clients/urban.png, images/cloudcannon-logo-blue.svg, images/jekyll-logo-black-red-transparent.png
- A visible note marks the demonstration content as illustrative.
- Portfolio thumbnails were screenshots of other websites and the technology row carried third-party logos; both became drawn placeholders, and the portfolio is labelled as example entries.
