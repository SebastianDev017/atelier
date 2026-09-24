# Contour license

Copyright (c) 2026 Sebastián Ruiz. All rights reserved.

Contour is a commercial Shopify theme. A merchant's right to use it comes from buying it through the Shopify Theme Store, on the terms Shopify sets for Theme Store themes.

This repository is not an open-source release. Outside those terms, no license is granted to copy, modify, redistribute, sublicense or resell Contour, in whole or in part.

## Third-party components

Contour includes the third-party code listed below. Each part stays under its own license, and each file keeps its original notice.

### Shopify Skeleton Theme

Contour was started from Shopify's Skeleton Theme (https://github.com/Shopify/skeleton-theme), and parts of it remain in the theme, for example `blocks/group.liquid`, `blocks/text.liquid` and `snippets/meta-tags.liquid`. Those parts are used under this license:

> Copyright (c) 2018-present Shopify Inc.
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, sell and/or create derivative works of the Software or any part thereof, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The rights granted above may only be exercised to develop themes that integrate or interoperate with Shopify software or services, and, if applicable, to distribute, offer for sale or otherwise make available any such themes via the Shopify Theme Store. All other uses of the Software are strictly prohibited.
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### GSAP 3.13.0

These files are GSAP 3.13.0, copyright 2025 GreenSock. They are used under the GSAP Standard License (https://gsap.com/standard-license), and each file carries its original header:

- `assets/gsap.min.js`
- `assets/scrolltrigger.min.js`
- `assets/splittext.min.js`
- `assets/flip.min.js`

### Lenis 1.1.14

`assets/lenis.min.js`: https://github.com/darkroomengineering/lenis. MIT License, copyright (c) 2024 darkroom.engineering. The full MIT notice is kept at the top of the file.

### QRCode.js

`assets/qrcode.min.js`: https://github.com/davidshimjs/qrcodejs. MIT License, copyright (c) 2012 davidshimjs. The full MIT notice is kept at the top of the file.

## Not bundled

These are loaded from Shopify at runtime and are not part of this repository:

- The 3D viewer (model-viewer), the Model Viewer UI and Shopify-XR, all through `Shopify.loadFeatures`.
- The fonts from Shopify's font library.

## Demo store content

The product photography, copy and other content in the Contour demo stores are not part of the theme and are not covered by this license.
