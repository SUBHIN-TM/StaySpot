'use strict';

// ── Accepted upload MIME types — SINGLE SOURCE OF TRUTH ──────────────────────
// Edit these arrays to allow or block file formats. Used everywhere uploads are
// validated: property photos/videos (presign) AND user avatars (multer).
// Add or remove a string and that's it — no other code change needed.
//
// Security note: do NOT add 'image/svg+xml'. SVGs can embed <script> and become
// a stored-XSS vector when served from our domain.

module.exports = {
  // Web-renderable image formats. (HEIC/HEIF from iPhones is intentionally left
  // out — most browsers can't display it.)
  image: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
  ],

  video: [
    'video/mp4',
    'video/webm',
    'video/quicktime', // .mov
    'video/x-matroska', // .mkv
  ],

  // Admin-only VERIFICATION PROOF (owner phone-verify call + property field visit).
  // Broader than listing media: photos, video, audio recordings, and PDFs.
  proof: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska',
    'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/x-m4a',
    'application/pdf',
  ],
};
