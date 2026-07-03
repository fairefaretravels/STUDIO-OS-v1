window.MEDIA = (function () {

    // =========================
    // STATE
    // =========================
    let queue = [];
    let index = 0;
    let isTransitioning = false;

    let advanceTimer = null;
    let stallTimer = null;

    const STALL_TIMEOUT_MS = 15000;

    const STATE = {
        IDLE: "idle",
        LOADING: "loading",
        PLAYING: "playing",
        STALLED: "stalled",
        FAILED: "failed"
    };

    let state = STATE.IDLE;

    // =========================
    // DOM
    // =========================
    const UI = {
        title: () => document.getElementById("title"),
        artist: () => document.getElementById("artist"),
        player: () => document.getElementById("player"),
        frame: () => document.getElementById("playerFrame"),
        npTitle: () => document.getElementById("npTitle"),
        npSub: () => document.getElementById("npSub"),
        ltHeadline: () => document.getElementById("ltHeadline"),
        ltSubheadline: () => document.getElementById("ltSubheadline"),
        tickerText: () => document.getElementById("tickerText"),
        banner: () => document.getElementById("nowPlayingBanner"),
        commercialOverlay: () => document.getElementById("commercialOverlay")
    };

    // =========================
    // STATE HELPERS
    // =========================
    function setState(s) {
        state = s;
    }

    // =========================
    // MEDIA NORMALIZER
    // =========================
    function normalize(item) {
        const src = item?.url || item?.src || "";

        const lower = src.toLowerCase();

        const isDrive = lower.includes("drive.google.com");
        const isYouTube = lower.includes("youtube.com") || lower.includes("youtu.be");
        const isHLS = lower.includes(".m3u8");
        const isMP4 = lower.includes(".mp4");

        return {
            ...item,
            src,
            type:
                isDrive || isYouTube ? "iframe"
                : isHLS ? "hls"
                : isMP4 ? "video"
                : "unknown"
        };
    }

    // =========================
    // UI UPDATE
    // =========================
    function updateUI(item) {
        const title = item?.title || item?.name || "Commercial Break";
        const sub = item?.artist || item?.category || item?.type || "";

        if (UI.title()) UI.title().innerText = title;
        if (UI.artist()) UI.artist().innerText = sub;

        if (UI.npTitle()) UI.npTitle().innerText = title;
        if (UI.npSub()) UI.npSub().innerText = sub;
        if (UI.ltHeadline()) UI.ltHeadline().innerText = title;
        if (UI.ltSubheadline()) UI.ltSubheadline().innerText = sub;

        if (UI.tickerText()) {
            UI.tickerText().innerText =
                `LIVE • NOW PLAYING: ${title} • ${sub} • Entertainment • News • Community • Stay tuned`;
        }

        if (UI.banner()) {
            UI.banner().classList.remove("show");
            setTimeout(() => UI.banner().classList.add("show"), 50);
        }
    }

    // =========================
    // RESET
    // =========================
    function reset(player, frame) {
        clearTimeout(advanceTimer);
        clearTimeout(stallTimer);

        if (player) {
            player.pause();
            player.removeAttribute("src");
            player.load();
        }

        if (frame) frame.src = "about:blank";
    }

    // =========================
    // STALL WATCHDOG
    // =========================
    function startStallWatch(item) {
        clearTimeout(stallTimer);

        stallTimer = setTimeout(() => {
            console.warn("STALL TIMEOUT:", item);
            fail(item, "STALL");
        }, STALL_TIMEOUT_MS);
    }

    function clearStall() {
        clearTimeout(stallTimer);
    }

    // =========================
    // ADVANCE
    // =========================
    function scheduleAdvance(item) {
        clearTimeout(advanceTimer);

        const seconds = item?.duration || 30;

        advanceTimer = setTimeout(() => {
            next();
        }, seconds * 1000);
    }

    // =========================
    // FAIL HANDLER
    // =========================
    function fail(item, reason) {
        console.warn("MEDIA FAIL:", reason, item);

        item._failCount = (item._failCount || 0) + 1;

        if (item._failCount > 2) {
            console.warn("SKIPPING PERMANENTLY FAILED ITEM:", item);
        }

        next();
    }

    // =========================
    // LOAD MEDIA
    // =========================
    function load(item) {
        const player = UI.player();
        const frame = UI.frame();

        if (!player || !frame) return;

        const media = normalize(item);

        setState(STATE.LOADING);
        updateUI(media);
        reset(player, frame);

        if (!media.src) {
            return fail(media, "NO_SRC");
        }

        // =========================
        // IFRAME ROUTE
        // =========================
        if (media.type === "iframe") {
            setLoading(true, media);

            player.style.display = "none";
            frame.style.display = "block";

            frame.src = media.src.includes("drive.google.com")
                ? `https://drive.google.com/file/d/${extractDriveId(media.src)}/preview`
                : media.src;

            setLoading(false, media);

            scheduleAdvance(media);
            return;
        }

        // =========================
        // VIDEO ROUTE
        // =========================
        frame.style.display = "none";
        player.style.display = "block";

        player.loop = !!media.loop;

        startStallWatch(media);

        const onCanPlay = async () => {
            clearStall();
            setLoading(false, media);

            setState(STATE.PLAYING);

            try {
                await player.play();
            } catch (err) {
                console.warn("AUTOPLAY BLOCKED:", err);
                fail(media, "AUTOPLAY");
                return;
            }

            scheduleAdvance(media);
        };

        const onError = () => {
            clearStall();
            fail(media, "ERROR");
        };

        player.oncanplay = null;
        player.onerror = null;

        player.addEventListener("canplay", onCanPlay, { once: true });
        player.addEventListener("error", onError, { once: true });

        player.src = media.src;
        player.load();
    }

    // =========================
    // DRIVE ID EXTRACT
    // =========================
    function extractDriveId(url) {
        const match =
            url.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
            url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

        return match ? match[1] : "";
    }

    // =========================
    // NEXT ITEM
    // =========================
    function next() {
        if (isTransitioning) return;

        isTransitioning = true;

        const player = UI.player();
        if (player) player.style.opacity = 0.3;

        setTimeout(() => {
            index = (index + 1) % queue.length;
            load(queue[index]);

            if (player) player.style.opacity = 1;

            isTransitioning = false;
        }, 500);
    }

    // =========================
    // START
    // =========================
    async function start(q) {
        queue = q || [];
        index = 0;

        if (!queue.length) {
            console.error("EMPTY QUEUE");
            return;
        }

        load(queue[0]);
    }

    // =========================
    // PUBLIC API
    // =========================
    return {
        start
    };

})();
