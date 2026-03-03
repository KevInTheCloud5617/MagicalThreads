# Magical Threads with Meg — Project Plan

## Overview
A fairytale-themed e-commerce website for Megan's embroidery, Cricut crafts, and custom goods business.

## Design Direction
- **Theme:** Disney castle / fairytale / storybook
- **Colors:** Navy (#1B2A4A), light blues (#A8D0E6, #E8F1F8), cream/gold accents
- **Vibe:** Cozy & handmade feel, but modern/clean UI — not cluttered or kitschy
- **Inspiration:** OpenClaw UI (clean, modern tooling with personality)

## Product Categories (from Instagram)
- Embroidered crewnecks/sweatshirts
- Custom tote bags
- Glass cups (iced coffee style, vinyl decals)
- Vinyl decals / stickers
- Book-themed items
- Custom orders

## Tech Stack
- **Framework:** Next.js (React-based, SSR for SEO, image optimization built-in)
- **Styling:** Tailwind CSS (fast iteration, modern look)
- **Language:** TypeScript
- **Deployment target:** Azure App Service (later) — local dev for now
- **Package manager:** npm

### Why Next.js over plain React?
- Built-in routing (no react-router setup)
- Image optimization (important for product photos)
- SEO-friendly server rendering (critical for a shop)
- API routes built-in (useful when we add a cart/checkout)
- Easy static export if we want to go simple

## Shop/Payments (TBD — build site first)
Options to evaluate later:
1. **Snipcart** — drop-in cart, works with any site, 2% fee after free tier
2. **Stripe Checkout** — lightweight payment links/sessions
3. **Shopify Buy SDK** — headless Shopify, use their backend + our frontend
4. **Square Online** — another option worth considering

We'll pick one once the site is presentable.

## Pages (v1)
1. **Home** — hero section with fairytale branding, featured products, about blurb
2. **Shop** — product grid with category filters
3. **About** — Megan's story, photos of her workspace/process
4. **Custom Orders** — form or info on how to request custom work
5. **Contact** — simple contact form or links to socials/DMs

## Phases

### Phase 1 — Foundation (current)
- [x] Create project plan
- [ ] Scaffold Next.js + Tailwind + TypeScript project
- [ ] Build layout (nav, footer, fairytale theme)
- [ ] Home page with hero, placeholder content
- [ ] Basic responsive design (mobile-first)

### Phase 2 — Content Pages
- [ ] Shop page with product grid (static data for now)
- [ ] About page
- [ ] Custom Orders page
- [ ] Contact page

### Phase 3 — Polish
- [ ] Animations/transitions (subtle fairytale touches)
- [ ] Product detail pages
- [ ] Image gallery / lightbox
- [ ] SEO meta tags, Open Graph

### Phase 4 — Commerce
- [ ] Choose and integrate payment/cart solution
- [ ] Product management (CMS or simple JSON/admin)
- [ ] Order notifications

### Phase 5 — Deploy
- [ ] Azure App Service setup
- [ ] Custom domain
- [ ] SSL
- [ ] Analytics

## File Structure
```
magical-threads/
├── plan.md          ← this file
└── site/            ← Next.js project lives here
    ├── src/
    │   ├── app/         (Next.js app router)
    │   ├── components/
    │   └── styles/
    ├── public/
    │   └── images/
    ├── package.json
    └── ...
```

## Notes
- All code stays within `magical-threads/site/`
- No global installs — project-local dependencies only
- Local dev only for now (no deployments until Kevin says go)
- Product photos TBD — using placeholders until Megan provides assets
