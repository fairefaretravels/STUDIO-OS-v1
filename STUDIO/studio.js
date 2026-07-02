window.STUDIO = (function () {

    let tracks = [];
    let shows = [];
    let ads = [];
    let rules = {};
    let analytics = {};

    // -----------------------------
    // LOAD JSON
    // -----------------------------
    async function loadJSON(file) {
        const res = await fetch(file);
        return res.json();
    }

    // -----------------------------
    // AI WEIGHTED PICKER
    // -----------------------------
    function weightedPick(pool, analyticsData, history = []) {

        if (!pool || pool.length === 0) return null;

        const scored = pool.map(item => {

            const data = analyticsData?.tracks?.[item.id];

            let base = 1;

            if (data) {
                const success = data.completions || 0;
                const fails = data.dropoffs || 0;
                base = 1 + (success * 0.3) - (fails * 0.5);
            }

            // anti-repeat penalty
            const recentPenalty =
                history.filter(h => h.id === item.id).length * 0.5;

            const weight = Math.max(base - recentPenalty, 0.1);

            return { item, weight };
        });

        const total = scored.reduce((sum, s) => sum + s.weight, 0);

        let rand = Math.random() * total;

        for (let s of scored) {
            rand -= s.weight;
            if (rand <= 0) return s.item;
        }

        return scored[0].item;
    }

    // -----------------------------
    // ADD ITEM TO QUEUE
    // -----------------------------
    function add(queue, item, state) {
        if (!item) return;

        queue.push(item);
        state.time += item.duration || 30;
        state.history.push(item);
    }

    // -----------------------------
    // BUILD SEGMENT
    // -----------------------------
    function buildSegment(segment) {

        const queue = [];
        const state = {
            time: 0,
            history: []
        };

        const segmentLimit = (segment.duration || 1) * 60 * 60; // hours → seconds

        const musicPool = tracks.filter(t => t.type === "music");
        const showPool = shows;
        const adPool = ads;

        while (state.time < segmentLimit) {

            const roll = Math.random();

            // -------------------------
            // MUSIC BLOCK
            // -------------------------
            if (roll < segment.music_ratio) {

                let blockTime = 0;
                const target = (rules.music_block_target || 25) * 60;

                while (blockTime < target && state.time < segmentLimit) {

                    const track = weightedPick(musicPool, analytics, state.history);
                    if (!track) break;

                    add(queue, track, state);
                    blockTime += track.duration || 300;

                    // safe ad insertion (time-based, not modulo bug)
                    if (state.time % (rules.commercial_every_minutes * 60 || 600) < 5) {

                        const ad = weightedPick(adPool, analytics, state.history);
                        if (ad) {
                            add(queue, { ...ad, type: "commercial" }, state);
                        }
                    }
                }

            }

            // -------------------------
            // SHOW BLOCK
            // -------------------------
            else if (roll < segment.music_ratio + segment.show_ratio) {

                const show = weightedPick(showPool, analytics, state.history);
                add(queue, show, state);
            }

            // -------------------------
            // AD BLOCK
            // -------------------------
            else {

                const ad = weightedPick(adPool, analytics, state.history);
                if (ad) add(queue, { ...ad, type: "commercial" }, state);
            }
        }

        return queue;
    }

    // -----------------------------
    // GENERATE FULL SCHEDULE
    // -----------------------------
    async function generate() {

        tracks = await loadJSON("tracks.json");
        shows = await loadJSON("shows.json");
        ads = await loadJSON("commercials.json");
        rules = await loadJSON("station_rules.json");

        // optional analytics (safe fallback)
        try {
            analytics = await loadJSON("analytics.json");
        } catch (e) {
            analytics = { tracks: {} };
        }

        let finalQueue = [];

        for (let segment of (rules.segments || [])) {
            finalQueue.push(...buildSegment(segment));
        }

        return finalQueue;
    }

    return {
        generate
    };

})();
