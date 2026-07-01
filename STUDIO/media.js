window.MEDIA = (function () {

    let queue = [];
    let index = 0;

    function load(item) {

        const player = document.getElementById("player");

        document.getElementById("title").innerText =
            item.title || "Commercial Break";

        player.src = item.url;
        player.play();
    }

    function next() {

        index++;

        if (index >= queue.length) {
            index = 0;
        }

        load(queue[index]);

        setTimeout(() => {
            next();
        }, (queue[index].duration || 30) * 1000);
    }

    async function start() {

        queue = await STUDIO.buildPlaylist();

        index = 0;

        load(queue[0]);

        setTimeout(() => {
            next();
        }, (queue[0].duration || 30) * 1000);
    }

    return { start };

})();
})();
