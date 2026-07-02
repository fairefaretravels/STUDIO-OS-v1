window.MEDIA = (function () {

    let queue = [];
    let index = 0;
    let isTransitioning = false;

    function setLoading(state, item) {
    const title = document.getElementById("title");
    if (!title) return;

    if (state) {
        title.innerText = "Loading Next Segment...";
    } else {
        title.innerText = item.title || item.name || "Commercial Break";
    }
}

    function updateBroadcastUI(item) {
        const titleText = item.title || item.name || "Commercial Break";
        const subtitleText = item.artist || item.category || item.type || "Live Programming";

        const npTitle = document.getElementById("npTitle");
        const npSub = document.getElementById("npSub");
        const ltHeadline = document.getElementById("ltHeadline");
        const ltSubheadline = document.getElementById("ltSubheadline");
        const tickerText = document.getElementById("tickerText");
        const banner = document.getElementById("nowPlayingBanner");
        const commercialOverlay = document.getElementById("commercialOverlay");

        if (npTitle) npTitle.innerText = titleText;
        if (npSub) npSub.innerText = subtitleText;
        if (ltHeadline) ltHeadline.innerText = titleText;
        if (ltSubheadline) ltSubheadline.innerText = subtitleText;

        if (tickerText) {
            tickerText.innerText =
                `STV LIVE • NOW PLAYING: ${titleText} • ${subtitleText} • Breaking updates • Entertainment • News • Weather • Community coverage • Stay tuned`;
        }

        if (banner) {
            banner.classList.remove("show");
            setTimeout(() => banner.classList.add("show"), 50);
            setTimeout(() => banner.classList.remove("show"), 5000);
        }

        if (commercialOverlay) {
            if ((item.type || "").toLowerCase() === "commercial") {
                commercialOverlay.classList.add("show");
            } else {
                commercialOverlay.classList.remove("show");
            }
        }
    }

    function load(item) {
        const player = document.getElementById("player");

        if (!player) {
            console.error("PLAYER ELEMENT NOT FOUND");
            return;
        }

        document.getElementById("title").innerText =
            item.title || item.name || "Commercial Break";

        document.getElementById("artist").innerText =
            item.artist || item.category || "";

        setLoading(true);
        updateBroadcastUI(item);

        const src = item.url || item.src;
        if (!src) {
            console.error("MISSING MEDIA URL:", item);
            next();
            return;
        }

        player.src = src;

        player.oncanplay = () => {
    setLoading(false, item);
    player.play().catch(err => {
        console.error("PLAY FAILED:", err);
    });
};

        player.onended = () => {
            next();
        };

        player.onerror = () => {
            console.error("MEDIA LOAD ERROR:", item);
            next();
        };
    }

    function next() {
        if (isTransitioning) return;
        isTransitioning = true;

        const player = document.getElementById("player");
        if (player) {
            player.style.opacity = 0.3;
        }

        setTimeout(() => {
            index = (index + 1) % queue.length;
            load(queue[index]);

            if (player) {
                player.style.opacity = 1;
            }

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

    return {
        start
    };

})();
