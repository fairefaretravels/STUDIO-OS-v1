window.STUDIO = (function () {

    // -----------------------------
    // LOAD JSON
    // -----------------------------
    async function loadJSON(file) {
        const res = await fetch(file);
        if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
        return res.json();
    }

    async function loadJSONSafe(file, fallback) {
        try {
            return await loadJSON(file);
        } catch (e) {
            console.warn(`Optional file "${file}" not loaded, using fallback.`, e);
            return fallback;
        }
    }

    // -----------------------------
    // LOOKUPS
    // -----------------------------
    function resolveTrack(id, tracksList) {
        const track = tracksList.find(t => t.id === id);
        if (!track) console.warn(`Track id "${id}" not found in tracks.json`);
        return track;
    }

    function resolveShow(id, showsList) {
        const show = showsList.find(s => s.id === id);
        if (!show) console.warn(`Show id "${id}" not found in shows.json`);
        return show;
    }

    function pickCommercial(commercials) {
        if (!commercials || !commercials.length) return null;
        return commercials[Math.floor(Math.random() * commercials.length)];
    }

    // -----------------------------
    // EXPAND A SHOW INTO PLAYABLE QUEUE ITEMS
    // (handles both single-video shows and series with episodes[])
    // -----------------------------
    function expandShow(show) {
        if (Array.isArray(show.episodes) && show.episodes.length) {
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

        if (!show.url && !show.src) {
            console.warn(`Show "${show.id}" has no url/src and no episodes[] — skipping. Add a playable url or an episodes[] array to shows.json.`);
            return [];
        }

        return [{
            ...show,
            type: "show"
        }];
    }

    // -----------------------------
    // BUILD A MUSIC BLOCK
    // Loops the playlist (if repeat: true) until block.duration is filled,
    // inserting a commercial every insertCommercialEvery seconds of playback.
    // -----------------------------
    function buildMusicBlock(block, tracksList, commercials) {
        const queue = [];
        const playlist = (block.playlist || [])
            .map(id => resolveTrack(id, tracksList))
            .filter(Boolean);

        if (!playlist.length) {
            console.warn("Music block has no resolvable tracks — skipping block.", block);
            return queue;
        }

        const targetDuration = block.duration || 1500;
        let elapsed = 0;
        let sinceLastCommercial = 0;
        let i = 0;

        while (elapsed < targetDuration) {
            const track = playlist[i % playlist.length];
            queue.push({ ...track });

            const dur = track.duration || 300;
            elapsed += dur;
            sinceLastCommercial += dur;

            if (block.insertCommercialEvery && sinceLastCommercial >= block.insertCommercialEvery) {
                const ad = pickCommercial(commercials);
                if (ad) {
                    queue.push({ ...ad, type: "commercial" });
                }
                sinceLastCommercial = 0;
            }

            i++;

            if (!block.repeat && i >= playlist.length) break;
        }

        return queue;
    }

    // -----------------------------
    // GENERATE FULL QUEUE FROM schedule.json
    // -----------------------------
    async function generate() {

        const [schedule, shows, tracksList, commercials] = await Promise.all([
            loadJSON("schedule.json"),
            loadJSON("shows.json"),
            loadJSON("tracks.json"),
            loadJSONSafe("commercials.json", [])
        ]);

        const queue = [];

        for (const block of (schedule.blocks || [])) {
            switch (block.type) {

                case "music_block": {
                    const items = buildMusicBlock(block, tracksList, commercials);
                    if (block.label) items.forEach(it => { if (it.type !== "commercial") it.blockLabel = block.label; });
                    queue.push(...items);
                    break;
                }

                case "show": {
                    const show = resolveShow(block.id, shows);
                    if (show) {
                        const items = expandShow(show);
                        if (block.label) items.forEach(it => it.blockLabel = block.label);
                        queue.push(...items);
                    }
                    break;
                }

                case "track": {
                    const track = resolveTrack(block.id, tracksList);
                    if (track) {
                        const item = { ...track };
                        if (block.label) item.blockLabel = block.label;
                        queue.push(item);
                    }
                    break;
                }

                default:
                    console.warn(`Unknown block type "${block.type}" in schedule.json — skipping.`, block);
            }
        }

        return queue;
    }

    return {
        generate
    };

})();
