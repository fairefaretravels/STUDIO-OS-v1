window.MEDIA = (function () {

    let queue = [];
    let index = 0;

    function getElement(id) {
        return document.getElementById(id);
    }

    function loadMedia(item) {

        const player = getElement("player");
        const title = getElement("nowTitle");
        const artist = getElement("nowArtist");

        if (!item) return;

        title.textContent = item.title || "Commercial Break";
        artist.textContent = item.artist || "";

        if (item.media) {
            player.src = item.media;
        }
    }

    function playNext() {
        index++;

        if (index >= queue.length) {
            index = 0; // loop entire channel
        }

        loadMedia(queue[index]);

        setTimeout(() => {
            playNext();
        }, (queue[index].duration || 30) * 1000);
    }

    async function start() {
        queue = await STUDIO.buildPlaylist();

        index = 0;
        loadMedia(queue[0]);

        setTimeout(() => {
            playNext();
        }, (queue[0].duration || 30) * 1000);
    }

    return {
        start
    };

})();
