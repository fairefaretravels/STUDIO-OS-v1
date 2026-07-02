window.MEDIA = (function () {

    let queue = [];
    let index = 0;

    function load(item) {

        console.log("NOW PLAYING:", item);

        const player = document.getElementById("player");
        const title = document.getElementById("title");

        if (!item || !item.url) {
            console.error("INVALID ITEM:", item);
            return;
        }

        title.innerText = item.title || "Commercial Break";

        player.src = item.url;
        player.load();
        player.play().catch(err => {
            console.error("PLAYBACK ERROR:", err);
        });
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

    async function start(q) {

        // allow either passed queue OR STUDIO-generated
        queue = q || await STUDIO.generate();

        index = 0;

        if (!queue || !queue.length) {
            console.error("EMPTY QUEUE");
            return;
        }

        load(queue[0]);

        setTimeout(() => {
            next();
        }, (queue[0].duration || 30) * 1000);
    }

    return {
        start
    };

})();
