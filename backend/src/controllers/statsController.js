'use strict';

const { query } = require('../config/db');
const { asyncHandler } = require('../utils/http');

// GET /api/stats  (public)
// Real, live counts for the landing page. We only count things the public
// would actually see / care about:
//   - listings : approved, available, not-deleted properties (same filter the
//                public browse page uses).
//   - seekers  : non-blocked users with the "seeker" role.
//   - owners   : non-blocked users with the "owner" role.
const getStats = asyncHandler(async (req, res) => {
  const [listings, seekers, owners] = await Promise.all([
    query(
      `SELECT COUNT(*)::int AS n FROM properties
        WHERE deleted_at IS NULL AND is_available = TRUE AND approval_status = 'approved'`
    ),
    query("SELECT COUNT(*)::int AS n FROM users WHERE role = 'seeker' AND is_blocked = FALSE"),
    query("SELECT COUNT(*)::int AS n FROM users WHERE role = 'owner' AND is_blocked = FALSE"),
  ]);

  res.json({
    listings: listings.rows[0].n,
    seekers: seekers.rows[0].n,
    owners: owners.rows[0].n,
  });
});

module.exports = { getStats };
