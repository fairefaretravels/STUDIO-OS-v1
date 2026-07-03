#!/usr/bin/env node
/**
 * STV On-Air: Cloudinary -> playlist.json
 * ----------------------------------------
 * 1. Loops a local folder of clips and uploads each one, tagged `stv-onair`.
 * 2. Pulls back EVERY asset currently carrying that tag (Admin API) --
 *    not just what got uploaded this run -- so playlist.json always
 *    matches the full live library, even if you tag things by hand
 *    in the Cloudinary console.
 * 3. Writes the result to playlist.json in your repo folder.
 *
 * Setup:
 *   npm install cloudinary
 *   export CLOUDINARY_API_KEY=xxxx
 *   export CLOUDINARY_API_SECRET=xxxx
 *   (cloud_name is fixed below: dyqfcbgqo)
 *
 * Usage:
 *   node cloudinary-to-playlist.js ./clips ./playlist.json
 *
 * Both args are optional -- defaults to ./clips and ./playlist.json.
 * If the clips folder doesn't exist, it skips straight to rebuilding
 * playlist.json from whatever's already tagged in Cloudinary.
 */

const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const CLIPS_DIR = process.argv[2] || './clips';
const PLAYLIST_PATH = process.argv[3] || './playlist.json';
const TAG = 'stv-onair';
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v', '.webm']);

cloudinary.config({
  cloud_name: 'dyqfcbgqo',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function uploadClips() {
  if (!fs.existsSync(CLIPS_DIR)) {
    console.log(`No folder at ${CLIPS_DIR} -- skipping upload step, rebuilding playlist.json from what's already tagged.`);
    return;
  }

  const files = fs.readdirSync(CLIPS_DIR).filter(f => VIDEO_EXTENSIONS.has(path.extname(f).toLowerCase()));

  if (files.length === 0) {
    console.log('No video files found in', CLIPS_DIR);
    return;
  }

  console.log(`Uploading ${files.length} clip(s) to Cloudinary...`);

  for (const file of files) {
    const fullPath = path.join(CLIPS_DIR, file);
    try {
      const result = await cloudinary.uploader.upload(fullPath, {
        resource_type: 'video',
        tags: [TAG],
      });
      console.log(`  uploaded: ${file} -> ${result.public_id}`);
    } catch (err) {
      console.error(`  FAILED: ${file} -- ${err.message}`);
    }
  }
}

async function rebuildPlaylist() {
  console.log(`Pulling every asset tagged "${TAG}"...`);

  let allResources = [];
  let nextCursor;

  do {
    const response = await cloudinary.api.resources_by_tag(TAG, {
      resource_type: 'video',
      max_results: 500,
      next_cursor: nextCursor,
    });
    allResources = allResources.concat(response.resources);
    nextCursor = response.next_cursor;
  } while (nextCursor);

  // Newest first, so fresh clips lead the queue
  allResources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const playlist = allResources.map(r => ({
    public_id: r.public_id,
    url: r.secure_url,
    format: r.format,
    duration: r.duration || null,
    created_at: r.created_at,
  }));

  fs.writeFileSync(PLAYLIST_PATH, JSON.stringify(playlist, null, 2));
  console.log(`Wrote ${playlist.length} entries to ${PLAYLIST_PATH}`);
}

(async () => {
  try {
    await uploadClips();
    await rebuildPlaylist();
    console.log('Done. git add/commit/push playlist.json (or drop it into GitHub\'s web UI).');
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
})();
