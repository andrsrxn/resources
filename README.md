# Resources

A curated hand-picked collection of hundreds of **free** resources, tools, and inspirations for developers and creators.

[![Astro](https://img.shields.io/badge/Astro-v7-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![React](https://img.shields.io/badge/React-v19-blue?logo=react&logoColor=white)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](LICENSE)

[![Resources Preview](https://res.cloudinary.com/dq5nfyajn/image/upload/v1786843106/banner_pabuhc.webp)](https://resources.andrsrxn.com)

## Overview

[**resources.andrsrxn.com**](https://resources.andrsrxn.com) is an open-source directory of the best **free** resources across modern web engineering, product design, SEO, cloud infrastructure, and self-learning I've collected throughout the years.

Built with **Astro 7**, **React 19**, and **Tailwind CSS v4**, this website is designed for speed, instant discoverability, and smooth interactions.

> This website is inspired on [desengs.com](https://desengs.com) by [MAZE](https://x.com/remvze), a list of resources for Design Engineers.

## Features

- **Real-time instant search**: Filter through hundreds of resources by title, categories, or tags in real time with URL query state persistence (`?s=...`).
- **Custom Table of Contents (TOC)**: Sticky TOC with real time active section indicator and clickable list that scrolls to the section.
- **Categorized directory**: Structured into 5 main categories described below.
- **Automated favicon fetcher**: Dedicated CLI pipeline that fetches, optimizes, and serves brand favicons locally.
- **Astro Islands architecture**: Ultra-fast static rendering with client-side hydration only where interactivity is needed (React components).
- **Kinetic smooth scroll**: Powered by Lenis for a smooth scrolling experience.
- **Modern dark aesthetics**: Premium sleek dark theme with glassmorphic cards and micro-interactions.

## Resource categories

| Section           | Description                                                                                                                       |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **`development`** | Code tools, UI component libraries, widgets, canvas/SVG generators, animations and other development-focused resources.           |
| **`design`**      | Visual assets, fonts, icons, illustrations, 3D/2D mockups, stock media, and other design-focused resources.                       |
| **`seo`**         | Search engine optimization tools, web vitals checkers, SERP previews, and other SEO-related resources.                            |
| **`services`**    | Interactive tools, cloud services, DBs, auth providers, hosting utilities, developer tools, and other service-oriented resources. |
| **`learning`**    | "Read-only" educational material, guides, roadmaps, tutorials, and other learning-focused resources.                              |

## Tech stack

- **Framework**: [Astro](https://astro.build) (v7) with `@astrojs/react`
- **UI library**: [React 19](https://react.dev)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + `tailwind-animations`
- **State and search**: [nuqs](https://nuqs.47ng.com) for URL query state synchronization
- **Smooth scroll**: [Lenis](https://lenis.darkroom.engineering)
- **Icons set**: `@andrsrxn/icons`
- **Linter and formatter**: [Biome](https://biomejs.dev) and [Prettier](https://prettier.io)
- **Package manager**: [pnpm](https://pnpm.io)

## Contributing

Contributions are welcome! Before submitting a Pull Request, please read the [CONTRIBUTING.md](CONTRIBUTING.md) guide for guidelines, category rules, and instructions on running the automated favicon pipeline.

## Brand assets, licensing and removal requests

All brand logos, trademarks, and favicons belong to their respective owners and are used solely for identification and navigation.

If you are a resource owner or representative and wish to request removal of your resource, or specify a custom license/attribution for a brand asset, please open an issue using the [Resource License or Removal Request](https://github.com/andrsrxn/resources/issues/new?template=resource-license-or-removal.yml) template.

## License

This project is licensed under the [CC BY-NC 4.0 License](LICENSE) — free to share and adapt with attribution, but not for commercial use.
