'use strict';

// Admin tool for managing the owner-curated localities list: view usage, merge
// duplicates/variants into one, rename (fix typos), and delete.

const { asyncHandler, ApiError } = require('../utils/http');
const {
  listWithCounts,
  previewMerge,
  mergeLocalities,
  renameLocality,
  deleteLocality,
} = require('../services/localities');

// Validate + extract the merge inputs shared by preview and commit.
function readMergeInput(body) {
  const { district, target, sources } = body || {};
  if (!district || !String(district).trim()) throw new ApiError(400, 'district is required');
  if (!target || !String(target).trim()) throw new ApiError(400, 'A target locality is required');
  const list = Array.isArray(sources) ? sources.filter((s) => s && String(s).trim()) : [];
  if (!list.length) throw new ApiError(400, 'Select at least one locality to merge in');
  return { district: String(district).trim(), target: String(target), sources: list.map(String) };
}

// GET /api/localities?district=&q=
const getLocalities = asyncHandler(async (req, res) => {
  const district = req.query.district ? String(req.query.district).trim() : '';
  const q = req.query.q ? String(req.query.q).trim() : '';
  res.json({ localities: await listWithCounts({ district, q }) });
});

// POST /api/localities/merge/preview — dry-run: how many properties would move.
const mergePreview = asyncHandler(async (req, res) => {
  const { district, target, sources } = readMergeInput(req.body);
  res.json(await previewMerge(district, target, sources));
});

// POST /api/localities/merge   body: { district, target, sources: [name, …] }
const merge = asyncHandler(async (req, res) => {
  const { district, target, sources } = readMergeInput(req.body);
  res.json(await mergeLocalities(district, target, sources));
});

// PATCH /api/localities/:id   body: { name }
const rename = asyncHandler(async (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) throw new ApiError(400, 'New name is required');
  const out = await renameLocality(req.params.id, String(name));
  if (!out) throw new ApiError(404, 'Locality not found');
  res.json(out);
});

// DELETE /api/localities/:id
const remove = asyncHandler(async (req, res) => {
  await deleteLocality(req.params.id);
  res.json({ ok: true });
});

module.exports = { getLocalities, mergePreview, merge, rename, remove };
