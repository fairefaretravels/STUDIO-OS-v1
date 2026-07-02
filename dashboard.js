window.saveMedia = function () {
    const title = document.getElementById("mediatitle").value.trim();
    const url = document.getElementById("mediaurl").value.trim();

    if (!title || !url) {
        alert("Please enter both a title and a URL.");
        return;
    }

    console.log("Saving media:", { title, url });

    // Later we'll save this into your media library.
};

window.goLive = function () {
    console.log("Sending current playlist to watch page...");
    // We'll wire this up once the player is finished.
};
