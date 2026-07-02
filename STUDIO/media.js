window.MEDIA = (function () {

    let queue = [];
    let index = 0;
    let isTransitioning = false;
    let advanceTimer = null;

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

    function clearScheduledAdvance() {
        if (advanceTimer) {
            clearTimeout(advanceTimer);
            advanceTimer = null;
        }
    }

    function scheduleAdvance(seconds) {
        clearScheduledAdvance();
        advanceTimer = setTimeout(() => next(), (seconds || 30) * 1000);
    }

    function isDriveLink(src) {
        return typeof src === "string" && src.includes("drive.google.com");
    }

    function load(item) {
        const player = document.getElementById("player");
        const frame = document.getElementById("playerFrame");

        if (!player || !frame) {
            console.error("PLAYER ELEMENT(S) NOT FOUND");
            return;
        }

        document.getElementById("title").innerText = item.title || item.name || "Commercial Break";
        document.getElementById("artist").innerText = item.artist || item.category || "";

        setLoading(true);
        updateBroadcastUI(item);
        clearScheduledAdvance();

        const src = item.url || item.src;

        if (!src) {
            console.error("MISSING MEDIA URL:", item);
            next();
            return;
        }

        if (isDriveLink(src)) {
            // Google Drive /preview links are embed pages, not direct video files.
            // A <video> tag can't play these — route through an iframe instead.
            player.pause();
            player.removeAttribute("src");
            player.style.display = "none";

            frame.style.display = "block";
            frame.src = src;

            setLoading(false, item);
            // Drive iframes don't fire an "ended" event we can listen to,
            // so advance the queue on a timer based on the item's duration.
            scheduleAdvance(item.duration || 30);

        } else {
            frame.style.display = "none";
            frame.src = "about:blank";

            player.style.display = "block";
            player.loop = !!item.loop;
            player.src = src;

            player.oncanplay = () => {
                setLoading(false, item);
                player.play().catch(err => {
                    console.error("PLAY FAILED:", err);
                });
                if (item.loop) {
                    // looping videos never fire "onended" — advance on a timer instead
                    scheduleAdvance(item.duration || 30);
                }
            };

            player.onended = () => {
                if (!item.loop) next();
            };

            player.onerror = () => {
                console.error("MEDIA LOAD ERROR:", item);
                next();
            };
        }
    }

    function next() {
        if (isTransitioning) return;
        isTransitioning = true;
        clearScheduledAdvance();

        const player = document.getElementById("player");
        if (player) player.style.opacity = 0.3;

        setTimeout(() => {
            index = (index + 1) % queue.length;
            load(queue[index]);
            if (player) player.style.opacity = 1;
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
