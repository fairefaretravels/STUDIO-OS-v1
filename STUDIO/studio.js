window.STUDIO = (function () {

    let tracks = [];
    let shows = [];
    let ads = [];
    let rules = {};

    async function loadJSON(file) {
        const res = await fetch(file);
        return res.json();
    }

    function weightedPick(pool, analytics, history = []) {

    const scored = pool.map(item => {

        const data = analytics?.tracks?.[item.id];

        let base = 1;

        if (data) {
            const success = data.completions || 0;
            const fails = data.dropoffs || 0;
            base = 1 + (success * 0.3) - (fails * 0.5);
        }

        // anti-repeat penalty
        const recentPenalty =
            history.filter(h => h.id === item.id).length * 0.5;

        return {
            item,
            weight: base - recentPenalty
        };
    });

    const totalWeight = scored.reduce((sum, s) => sum + Math.max(s.weight, 0.1), 0);

    let rand = Math.random() * totalWeight;

    for (let s of scored) {
        rand -= Math.max(s.weight, 0.1);
        if (rand <= 0) return s.item;
    }

    return scored[0].item;
}

    function add(queue, item, state) {
        queue.push(item);
        state.time += item.duration || 30;
        state.history.push(item);
    }

    function buildSegment(segment) {

        const queue = [];
        const state = {
            time: 0,
            history: []
        };

        const limit = segment.duration * 60 * 60;

        while (state.time < limit) {

            const roll = Math.random();

            const musicPool = tracks.filter(t => t.type === "music");
            const showPool = shows;
            const adPool = ads;

            if (roll < segment.music_ratio) {

                // MUSIC BLOCK (structured 25-min chunks)
                let block = 0;

                while (block < (rules.music_block_target * 60)) {

                    const track = pick(musicPool, state.history);
                    if (!track) break;

                    add(queue, track, state);
                    block += track.duration || 300;

                    // smart ad insertion
                    if (block % (10 * 60) < 30) {

                        const ad = pick(adPool, state.history);
                        if (ad) add(queue, { type: "commercial", ...ad }, state);
                    }
                }

            } else if (roll < segment.music_ratio + segment.show_ratio) {

                const show = pick(showPool, state.history);
                if (show) add(queue, show, state);

            } else {

                const ad = pick(adPool, state.history);
                if (ad) add(queue, { type: "commercial", ...ad }, state);
            }
        }

        return queue;
    }

    async function generate() {

        tracks = await loadJSON("tracks.json");
        shows = await loadJSON("shows.json");
        ads = await loadJSON("commercials.json");
        rules = await loadJSON("station_rules.json");

        let final = [];

        for (let segment of rules.segments) {
            final.push(...buildSegment(segment));
        }

        return final;
    }

    return {
        generate
    };

})();
