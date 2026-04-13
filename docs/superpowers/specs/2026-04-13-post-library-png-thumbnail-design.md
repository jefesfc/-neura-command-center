# Post Library PNG Thumbnail — Design Spec

## Goal

Make the Post Library show the full rendered post PNG as the thumbnail instead of the AI background image.

## Context

**Current state:**
- `POST /api/posts/:id/save-png` already saves the rendered PNG to disk at `social-posts/post_{id}.png` and stores the filename in the `png_path` DB column.
- `server.js` already serves `/social-posts/` as static files via `express.static`.
- `PostLibrary.jsx` already has thumbnail logic that prioritizes `png_path` over `image_b64`.
- **The gap:** `GET /api/posts` omits `png_path`, `post_type`, `slides`, and `palette` from its SELECT, so the Post Library never receives `png_path` and falls back to `image_b64` (the AI background, not the rendered post).

## The Fix

One change: `src/routes/posts.js` — the list endpoint SELECT query.

**Before:**
```sql
SELECT id, title, headline, bullets, cta, tone, system, format,
       caption, hashtags, status, image_b64, created_at, updated_at
FROM posts
```

**After:**
```sql
SELECT id, title, headline, bullets, cta, tone, system, format,
       caption, hashtags, status, image_b64, png_path,
       post_type, slides, palette, created_at, updated_at
FROM posts
```

## Result

`PostLibrary.jsx` receives `png_path` in each post object. Its existing thumbnail logic (`png_path` → `image_b64` → placeholder) automatically shows the full rendered post PNG without any frontend changes.

## Files Changed

| File | Change |
|------|--------|
| `src/routes/posts.js` | Add `png_path`, `post_type`, `slides`, `palette` to list endpoint SELECT |

No DB schema changes. No frontend changes. No new dependencies.

## Out of Scope

- Carousel slide-by-slide PNG thumbnails in the library (slide 0 PNG is sufficient for the thumbnail)
- Retroactive rendering of posts that were generated before this fix (they already have PNGs on disk if the generator was used; if not, they'll show `image_b64` as before)
