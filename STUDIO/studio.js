window.STUDIO = (function () {

    let tracks = [];
    let ads = [];

    async function loadJSON(file) {
        const res = await fetch(file);
        return res.json();
    }

    function findTrack(id) {
        return tracks.find(t => t.id === id);
    }

    function buildMusicBlock(block) {

        let queue = [];
        let total = 0;
        let adIndex = 0;

        while (total < block.duration) {

            for (let id of block.playlist) {

                if (total >= block.duration) break;

                const track = findTrack(id);
                if (!track) continue;

                queue.push(track);
                total += track.duration;

                // insert commercial
                if (block.insertCommercialEvery &&
                    total % block.insertCommercialEvery < track.duration) {

                    queue.push(ads[adIndex % ads.length]);
                    adIndex++;
                }
            }
        }

        return queue;
    }

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
