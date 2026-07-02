window.STUDIO = (function () {

    let tracks = [];
    let shows = [];
    let ads = [];
    let rules = {};

    async function loadJSON(file) {
        const res = await fetch(file);
        return res.json();
    }

    function pick(arr, lastUsed = []) {

        // anti-repeat logic
        const filtered = arr.filter(x => {
            const count = lastUsed.filter(y => y.id === x.id).length;
            return count < (rules.max_repeats || 2);
        });

        return filtered[Math.floor(Math.random() * filtered.length)];
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
