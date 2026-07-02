window.STUDIO = (function () {

    // -----------------------------
    // SAFE LOAD JSON (NEVER CRASHES)
    // -----------------------------
    async function loadJSON(file, fallback = null) {
        try {
            const res = await fetch(`./${file}`);
            if (!res.ok) throw new Error(`${file} failed: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn(`[STUDIO] Using fallback for ${file}`, err);
            return fallback;
        }
    }

    // -----------------------------
    // SAFE RESOLVERS
    // -----------------------------
    function resolveTrack(id, tracks) {
        return tracks.find(t => t.id === id) || null;
    }

    function resolveShow(id, shows) {
        return shows.find(s => s.id === id) || null;
    }

    function pickCommercial(comms) {
        if (!comms?.length) return null;
        return comms[Math.floor(Math.random() * comms.length)];
    }

    // -----------------------------
    // EXPAND SHOWS
    // -----------------------------
    function expandShow(show) {
        if (!show) return [];

        if (Array.isArray(show.episodes)) {
            return show.episodes.map(ep => ({
                id: ep.id,
                title: `${show.title}: ${ep.title}`,
                artist: show.title,
                type: "show_episode",
                duration: ep.duration || 60,
                url: ep.video || ep.url,
                cover: ep.cover
            }));
        }

        return [{
            ...show,
            type: "show"
        }];
    }

    // -----------------------------
    // MUSIC BLOCK BUILDER
    // -----------------------------
    function buildMusicBlock(block, tracks, commercials) {
        const playlist = (block.playlist || [])
            .map(id => resolveTrack(id, tracks))
            .filter(Boolean);

        if (!playlist.length) return [];

        const queue = [];
        let i = 0;
        let elapsed = 0;
        let adTimer = 0;

        const target = block.duration || 1200;

        while (elapsed < target) {
            const track = playlist[i % playlist.length];

            queue.push({
                ...track,
                type: track.type || "music"
            });

            const dur = track.duration || 180;
            elapsed += dur;
            adTimer += dur;

            if (block.insertCommercialEvery && adTimer >= block.insertCommercialEvery) {
                const ad = pickCommercial(commercials);
                if (ad) queue.push({ ...ad, type: "commercial" });
                adTimer = 0;
            }

            i++;
            if (!block.repeat && i >= playlist.length) break;
        }

        return queue;
    }

    // -----------------------------
    // MAIN GENERATOR (SAFE MODE)
    // -----------------------------
    async function generate() {

        const schedule = await loadJSON("schedule.json", { blocks: [] });
        const shows = await loadJSON("shows.json", []);
        const tracks = await loadJSON("tracks.json", []);
        const commercials = await loadJSON("commercials.json", []);

        const queue = [];

        for (const block of schedule.blocks || []) {

            try {

                if (block.type === "music_block") {
                    const items = buildMusicBlock(block, tracks, commercials);
                    items.forEach(i => i.blockLabel = block.label || i.blockLabel);
                    queue.push(...items);
                }

                if (block.type === "show") {
                    const show = resolveShow(block.id, shows);
                    const items = expandShow(show);
                    items.forEach(i => i.blockLabel = block.label || i.blockLabel);
                    queue.push(...items);
                }

                if (block.type === "track") {
                    const track = resolveTrack(block.id, tracks);
                    if (track) {
                        queue.push({
                            ...track,
                            type: "track",
                            blockLabel: block.label || track.blockLabel
                        });
                    }
                }

            } catch (e) {
                console.warn("[STUDIO] Block failed:", block, e);
            }
        }

        console.log(`[STUDIO] Queue generated: ${queue.length} items`);
        return queue;
    }

    return { generate };

})();
