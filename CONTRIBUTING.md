# Contributing to resources

Thank you for considering contributing to [**resources.andrsrxn.com**](https://resources.andrsrxn.com)! This project relies on community contributions to stay up to date with the best free tools, libraries, and guides.

> [!NOTE]
> **Acceptance policy**: Submitting a Pull Request does not guarantee that it will be merged. Inclusion of any resource is based strictly on maintainer criteria, quality evaluation, and fit for the collection.

---

## Contribution criteria

Before submitting a new resource, please ensure it meets the following standards:

1. **Free to access**: The resource must offer a functional free tier, open-source access, or free educational content. Purely paid tools without a useful free version will not be accepted.
2. **High quality and useful**: It must provide real value to developers, designers, or creators. No low-effort spam or pure self-promotional advertising.
3. **Property disclosure**: In your Pull Request description, **you must specify whether the resource is your own property or a third-party resource**.

---

## How to add a new resource

Follow these steps to submit a new resource to the directory:

### Step 1: Locate the right category

Open [`src/lib/constants/resources.ts`](./src/lib/constants/resources.ts) and find the appropriate category:

| Section           | Description                                                                                                                       | Examples                                                |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| **`development`** | Code tools, UI component libraries, widgets, canvas/SVG generators, animations and other development-focused resources.           | Tailwind components, motion libraries, etc...           |
| **`design`**      | Visual assets, fonts, icons, illustrations, 3D/2D mockups, stock media, and other design-focused resources.                       | Font foundries, icon sets, mockups, etc...              |
| **`seo`**         | Search engine optimization tools, web vitals checkers, SERP previews, and other SEO-related resources.                            | Meta tag auditors, schema checkers, etc...              |
| **`services`**    | Interactive tools, cloud services, DBs, auth providers, hosting utilities, developer tools, and other service-oriented resources. | Free cloud DBs, email APIs, hosting, etc...             |
| **`learning`**    | "Read-only" educational material, guides, roadmaps, tutorials, and other learning-focused resources.                              | AI fundamentals, roadmaps, accessibility guides, etc... |

### Step 2: Add the resource object

Add your resource object into the corresponding category's `items` array with these required attributes:

```typescript
{
  title: 'Example Tool', // Official name or web title
  url: 'https://example.com', // Direct URL to the resource
  favicon: '', // LEAVE EMPTY! Generated automatically in Step 3
  tags: ['AI', 'Testing', 'Modern'], // Array of meaningful, non-redundant tags. Max of 3 words.
}
```

> [!TIP]
> **Tags**: Choose concise, accurate tags that describe what the resource does. You can include any of the `FEATURED_TAGS` (which are highlighted in the UI by default) as well as descriptive custom tags.

### Step 3: Run the favicon pipeline

Run the automated favicon fetcher script:

```bash
pnpm fetch:favicons
```

This script will automatically:

- Fetch the brand's favicon or generate an initial fallback icon.
- Resize it to **64x64px** and convert it to `.webp` format in `public/favicons/`.
- Update `resources.ts` with the generated path (e.g. `favicon: '/favicons/example-tool.webp'`).

> **Notice**: After this step, verify that the favicon is correctly displayed on the website by running `pnpm dev` and checking the resource page.
> If the favicon is white or mostly white, set `inverted: true` in the resource object.

### Step 4: License and brand assets (if applicable)

If the resource logo or icon requires a specific custom license or attribution, add a markdown file on `public/licenses`:

- Path: `public/licenses/<slug>.LICENSE.md`
- Example: `public/licenses/example-tool.LICENSE.md`

### Step 5: Submit your pull request

Submit a Pull Request with a clear title (e.g., `feat: add Example Tool to development/inspiration`).

In your PR description, explicitly state:

- Is this your own property or a third-party resource?
- Why is this resource useful to the community?

---

Thank you for helping build a better resource directory for everyone!
