window.MEDIA = (function () {

    let queue = [];
    let index = 0;
    let isTransitioning = false;

    function setLoading(state) {
        const title = document.getElementById("title");
        if (state) {
            title.innerText = "Loading Next Segment...";
        }
    }

    function load(item) {

        const player = document.getElementById("player");

        document.getElementById("title").innerText =
            item.title || "Commercial Break";

        document.getElementById("artist").innerText =
            item.artist || "";

        setLoading(true);

        player.src = item.url;

        player.oncanplay = () => {
            setLoading(false);
            player.play().catch(() => {});
        };
    }

    function next() {

        if (isTransitioning) return;
        isTransitioning = true;

        const player = document.getElementById("player");

        // fade out effect (simple TV-style cut)
        player.style.opacity = 0.3;

        setTimeout(() => {

            index++;

            if (index >= queue.length) {
                index = 0;
            }

            load(queue[index]);

            player.style.opacity = 1;

            isTransitioning = false;

            setTimeout(() => {
                next();
            }, (queue[index].duration || 30) * 1000);

        }, 600);
    }

    async function start(q) {

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
})();
