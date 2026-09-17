Original upstream design built from the pinned source. Build dependencies installed without lifecycle scripts. Root asset and local navigation paths made relative for Plotform previews and static exports. Original framework source retained in vendor/templates/modern-astrowind.
Forms are not connected to a backend; submission is blocked to prevent sending to upstream demo services.

The upstream Netlify/Decap admin entry is omitted from the static distribution because it requires separate external hosting/authentication configuration. It remains in the original source archive. Remote display images are vendored with original URLs in vendor-remote/SOURCES.json.
