# API Contract — stable across all 4 stages (§7)

Base: `/api/v1`. Every mutating endpoint accepts `Idempotency-Key`.
Every list endpoint is cursor-paginated.

See root README for the full endpoint table. This file is the source of
truth the frontend codes against — if a Stage 2 split changes anything
here, that's a bug, not a refactor.
