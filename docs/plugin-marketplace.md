# Plugin Marketplace — Phase 9.3.0

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Plugin Marketplace                                     │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │                        PluginMarketplace                                  │    │
│  │                                                                           │    │
│  │  publish(listing)    ──→ creates listing entry with metadata              │    │
│  │  listListings(filter) ──→ search/filter by category, verified, text       │    │
│  │  getListing(id)      ──→ single listing details                           │    │
│  │  incrementDownloads  ──→ download counter (per-install)                   │    │
│  │  verify/unverify     ──→ publisher verification toggle                    │    │
│  │  getFeatured         ──→ verified + rating >= 4, sorted by downloads      │    │
│  │  getTopRated         ──→ sorted by rating (desc)                          │    │
│  │  getRecentlyUpdated  ──→ sorted by updatedAt (desc)                       │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │   PluginRatings      │  │   PluginReviews      │  │   PluginSearch          │  │
│  │─────────────────────│  │─────────────────────│  │─────────────────────────│  │
│  │ rate(pluginId,user) │  │ addReview(plugin,    │  │ search(query, opts)     │  │
│  │ getAverage(pluginId)│  │   user, {title,body, │  │   → union of installed   │  │
│  │ getCount(pluginId)  │  │   rating})           │  │     + marketplace        │  │
│  │ getUserRating(      │  │ getReviews(pluginId) │  │ searchByCategory(cat)    │  │
│  │   pluginId, userId) │  │ deleteReview(id)     │  │   → local + marketplace   │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐    │
│  │                        Control Plane UI                                   │    │
│  │                                                                           │    │
│  │  ┌─────────────┐  ┌─────────────────┐  ┌──────────────┐                   │    │
│  │  │  Installed   │  │  Marketplace    │  │  Categories  │                   │    │
│  │  │─────────────│  │─────────────────│  │──────────────│                   │    │
│  │  │ My Plugin   │  │ Featured:       │  │ analytics(5) │                   │    │
│  │  │ v1.0.0      │  │  ★ Top Plugin   │  │ dashboard(3) │                   │    │
│  │  │ [Disable]   │  │  ★ Verified     │  │ devops(7)    │                   │    │
│  │  │ [Uninstall] │  │ Search: [____]  │  │ testing(2)   │                   │    │
│  │  └─────────────┘  └─────────────────┘  └──────────────┘                   │    │
│  │                                                                           │    │
│  │  ┌──────────────────────────────────────────────────────────────────────┐ │    │
│  │  │  Metric Cards: Installed (N) · Enabled (N) · Loaded (N) · Hooks (N)  │ │    │
│  │  └──────────────────────────────────────────────────────────────────────┘ │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Marketplace Data Flow

```
Plugin Author                        Marketplace                         Consumer
     │                                    │                                 │
     │  Publish listing                   │                                 │
     │───────────────────────────────────→│                                 │
     │                                    │  Verify publisher               │
     │  Verified status                   │─────────────────────┐           │
     │←───────────────────────────────────│                     │           │
     │                                    │←────────────────────┘           │
     │                                    │                                 │
     │                              Search/List                            │
     │                                    │←────────────────────────────────│
     │                                    │                                 │
     │                              Install                                │
     │                                    │←────────────────────────────────│
     │                                    │                                 │
     │  Download tracked                  │                                 │
     │───────────────────────────────────→│                                 │
     │                                    │                                 │
     │                              Rate & Review                          │
     │                                    │←────────────────────────────────│
     │                                    │                                 │
```

## Listing Entry Structure

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Does something amazing.",
  "author": "Plugin Author",
  "version": "1.0.0",
  "categories": ["analytics", "dashboard"],
  "tags": ["awesome", "analytics"],
  "downloads": 1423,
  "rating": 4.5,
  "reviewCount": 28,
  "homepage": "https://example.com/plugin",
  "repository": "https://github.com/author/my-plugin",
  "license": "MIT",
  "verified": true,
  "publishedAt": 1718800000000,
  "updatedAt": 1719400000000
}
```

## Publisher Verification

Publishers can be verified to indicate trustworthiness:

```js
// Verify a publisher (admin only)
manager.marketplace.verify('my-plugin');
// → listing.verified = true

// Unverify
manager.marketplace.unverify('my-plugin');
// → listing.verified = false

// List only verified plugins
const verifiedOnly = manager.marketplace.listListings({ verified: true });
```

Verified plugins appear in the `getFeatured()` list if their rating is >= 4.0.

## Ratings

1–5 star rating system:

```js
// Rate a plugin
const result = manager.ratePlugin('my-plugin', 'user-123', 5);
// → { success: true, average: 4.5, count: 10 }

// Get average rating
const avg = manager.getPluginRating('my-plugin');
// → 4.5

// Get user's rating
const userRating = manager.ratings.getUserRating('my-plugin', 'user-123');
// → 5
```

### Rating Rules

- Score must be 1–5 (integer or decimal)
- One rating per user per plugin — subsequent calls update existing rating
- Average is rounded to 1 decimal place
- Zero downloads or zero ratings returns 0

## Reviews

Text reviews with optional rating:

```js
// Add a review
const review = manager.addReview('my-plugin', 'user-123', {
  title: 'Great plugin!',
  body: 'This plugin solved all our problems.',
  rating: 5
});
// → { id: 'rev-...', pluginId, userId, title, body, rating, createdAt, updatedAt }

// Get all reviews for a plugin
const reviews = manager.getReviews('my-plugin');

// Delete a review
const deleted = manager.reviews.deleteReview('rev-abc123');
```

## Search

Unified search across installed and marketplace plugins:

```js
// Text search (matches id, name, description, author, keywords)
const results = manager.searchPlugins('analytics', { sort: 'name', limit: 10 });
// → { results: [{ id, name, type: 'installed'|'marketplace', version }], total, offset, limit }

// Category search
const category = manager.searchByCategory('analytics');
// → { local: [{ id, name }], marketplace: [{ id, name }], total }

// List all categories with counts
const categories = manager.getCategories();
// → [{ name: 'analytics', count: 5 }, { name: 'dashboard', count: 3 }]
```

### Sort Options

- `name` — alphabetical by name
- `version` — descending by semantic version
- Default — relevance (order from registry + marketplace)

## Featured, Top Rated, Recently Updated

```js
// Featured: verified + rating >= 4, sorted by downloads (max 10)
const featured = manager.getFeatured();

// Top rated: sorted by rating desc (default 10)
const topRated = manager.getTopRated(5);

// Recently updated: sorted by updatedAt desc (default 10)
const recent = manager.getRecentlyUpdated(5);
```

## Download Tracking

```js
// Increment download count (called during install flow)
manager.marketplace.incrementDownloads('my-plugin');
```

## Integration

- **Installed plugins**: Managed via `PluginManager` — install, uninstall, enable, disable, reload
- **Marketplace listings**: Managed via `PluginMarketplace` — publish, search, verify, featured
- **Ratings**: `PluginRatings` — 1–5 scoring, per-user, averages
- **Reviews**: `PluginReviews` — CRUD with title, body, rating
- **Search**: `PluginSearch` — union of installed + marketplace results
- **Control Plane**: SSR plugins page with 3 tabs (Installed, Marketplace, Categories) + 4 metric cards
- **API**: REST endpoints at `/api/v1/plugins/` for all marketplace operations
