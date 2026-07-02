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
            player.play().catch(err => {
                console.error("PLAY FAILED:", err);
            });
        };
    }

    function next() {
        if (isTransitioning) return;
        isTransitioning = true;

        const player = document.getElementById("player");
        player.style.opacity = 0.3;

        setTimeout(() => {
            index = (index + 1) % queue.length;
            load(queue[index]);
            player.style.opacity = 1;
            isTransitioning = false;
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
    }

    return { start };

})();
