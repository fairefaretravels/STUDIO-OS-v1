window.STUDIO = (function () {

    // Root-relative so it always resolves to the real repo root,
    // regardless of whether /watch gets served as /watch or /watch/.
    const BASE = "/STUDIO-OS-v1/";

    async function loadJSON(file, fallback = []) {
        try {
            const res = await fetch(`${BASE}${file}`);
            if (!res.ok) throw new Error(`${file} failed: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn(`[STUDIO] Using fallback for ${file}`, err);
            return fallback;
        }
    }

    // Just load the flat, pre-ordered playlist and play it top to bottom, on loop.
    async function generate() {
        const playlist = await loadJSON("playlist.json", []);
        console.log(`[STUDIO] Queue generated: ${playlist.length} items`);
        return playlist;
    }

    return { generate };

})();
