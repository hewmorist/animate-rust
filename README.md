# Gallery Drone

Browser runtime with four faithful 1200-pixel JPEG painting reproductions, each under 100 KB. Compiled WebAssembly, browser interface, loader, images and victory sound only; Rust source stays private.

Serve this directory directly, or run `node stage-gallery.cjs` and serve `public/`. No Rust compilation or package installation is needed. The packaging script stamps the build commit into the bottom-right revision label.

Play by centering each painting and the hanging mobile in the flashlight, choosing the artist, and recording the answer. Tap a painting for inspection. Identify all five to restore the lights.

The third-party browser loader license is preserved in `vendor/LICENSE-MIT`. This repository adds no license grant for the project.
