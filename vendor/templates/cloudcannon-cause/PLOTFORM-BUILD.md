Source: https://github.com/CloudCannon/cause-jekyll-template
Pinned revision: a1ceffe73093a4eafc4d0613d141494b58e95fcf
Licence: MIT (the upstream LICENSE file is kept beside this note)

Build: `bundle install` then `bundle exec jekyll build` produces `_site`.
Plotform makes the built output's local references relative and adds an
unconnected-form guard, then publishes it under public/templates/.

Changes made to the upstream source before building:
- Google Analytics block removed from the layout.
- Disqus comment embed removed.
- Google Fonts stylesheet replaced with self-hosted woff2 files.
- Remote demo photographs (source.unsplash.com, unsplash.it, placehold.it, placekitten.com, placebear.com, fillmurray.com) replaced with placeholder artwork drawn for this repository.
- Bundled photographs removed and replaced with placeholder artwork drawn for this repository: images/sheep.jpg, images/sheep2.jpg, images/wooly.jpg
- A visible note marks the demonstration content as illustrative.
- The Donorbox donation embed was replaced with an unconnected note, and the population figures on the front page were replaced with a prompt.
