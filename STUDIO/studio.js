window.STUDIO = (function () {

    let tracks = [];
    let shows = [];
    let ads = [];
    let rules = {};

    async function loadJSON(file) {
        const res = await fetch(file);
        return res.json();
    }

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // 👇 THIS IS STEP 2 (PASTE HERE)
    function buildTimeline() {

        const queue = [];
        let time = 0;
        const DAY_LIMIT = 24 * 60 * 60;

        function add(item) {
            queue.push(item);
            time += item.duration || 30;
        }

        while (time < DAY_LIMIT) {

            const roll = Math.random();

            if (roll < rules.content_weights.music) {

                let blockTime = 0;

                while (blockTime < rules.music_block_minutes * 60) {

                    const track = pick(tracks.filter(t => t.type === "music"));
                    if (!track) break;

                    add(track);
                    blockTime += track.duration || 300;

                    if (blockTime % (rules.commercial_every_minutes * 60) < 30) {

                        const ad = pick(ads);
                        add({ type: "commercial", ...ad });
                    }
                }

            } else {

                const show = pick(shows);
                if (show) add(show);
            }
        }

        return queue;
    }

    async function generate() {

        tracks = await loadJSON("tracks.json");
        shows = await loadJSON("shows.json");
        ads = await loadJSON("commercials.json");
        rules = await loadJSON("station_rules.json");

        return buildTimeline(); // 👈 IMPORTANT
    }

    return {
        generate
    };

})();

    function buildShowBlock(block) {
        const showTrack = tracks.find(t => t.id === block.id);
        return showTrack ? [showTrack] : [];
    }

    async function buildPlaylist() {

        const schedule = await loadJSON("schedule.json");
        const data = await loadJSON("tracks.json");
        const adData = await loadJSON("commercials.json");

        tracks = data;
        ads = adData;

        let finalQueue = [];

        for (let block of schedule.blocks) {

            if (block.type === "music_block") {
                finalQueue.push(...buildMusicBlock(block));
            }

            if (block.type === "show") {
                finalQueue.push(...buildShowBlock(block));
            }
        }

        return finalQueue;
    }

    return { buildPlaylist };

})();
