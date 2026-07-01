window.STUDIO = (function () {

    async function loadJSON(file) {
        const res = await fetch(file);
        return res.json();
    }

    function repeatToFill(block, durationLimit = 1500) {
        const result = [];
        let total = 0;

        while (total < durationLimit) {
            for (let item of block) {
                if (total >= durationLimit) break;
                result.push(item);
                total += item.duration || 300;
            }
        }

        return result;
    }

    function insertCommercials(queue, commercials, interval = 5) {
        const result = [];
        let count = 0;

        for (let item of queue) {
            result.push(item);
            count++;

            if (count % interval === 0 && commercials.length) {
                result.push(commercials[0]);
            }
        }

        return result;
    }

    async function buildPlaylist() {

        const tracksData = await loadJSON("tracks.json");
        const commercials = await loadJSON("commercials.json");
        const schedule = await loadJSON("schedule.json");

        let finalQueue = [];

        for (let block of schedule) {

            if (block.type === "music_block") {

                const blockTracks = block.playlist.map(id =>
                    tracksData.find(t => t.id === id)
                );

                let filled = repeatToFill(blockTracks, block.length);

                filled = insertCommercials(
                    filled,
                    commercials,
                    block.insertCommercialEvery || 5
                );

                finalQueue.push(...filled);
            }

            if (block.type === "show") {
                finalQueue.push(block);
            }
        }

        return finalQueue;
    }

    return {
        buildPlaylist
    };

})();
