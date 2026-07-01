function saveMedia() {
  const title = document.getElementById("title").value;
  const url = document.getElementById("url").value;

  if (!title || !url) {
    alert("Missing title or URL");
    return;
  }

  addMedia(title, url);
  document.getElementById("title").value = "";
  document.getElementById("url").value = "";
}

function goLive() {
  const library = JSON.parse(localStorage.getItem("mediaLibrary")) || [];

  if (library.length === 0) {
    alert("No media in library");
    return;
  }

  const last = library[library.length - 1];
  localStorage.setItem("currentStream", last.url);

  alert("Now Live: " + last.title);
}
