window.MEDIA = (function () {

    let queue = [];
    let index = 0;

   function load(item) {

    const player = document.getElementById("player");

    document.getElementById("title").innerText =
        item.title || "Commercial Break";

    document.getElementById("artist").innerText =
        item.artist || "";

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
