const CLOUD_NAME = "YOUR_CLOUD_NAME";
const UPLOAD_PRESET = "YOUR_UNSIGNED_PRESET";

let mediaLibrary = JSON.parse(localStorage.getItem("mediaLibrary")) || [];

// Add media manually (from Cloudinary URL or Canva export)
function addMedia(title, url, type = "video") {
  const item = {
    id: Date.now(),
    title,
    url,
    type,
    createdAt: new Date().toISOString()
  };

  mediaLibrary.push(item);
  localStorage.setItem("mediaLibrary", JSON.stringify(mediaLibrary));
  renderLibrary();
}

// Render library in Studio
function renderLibrary() {
  const container = document.getElementById("library");
  if (!container) return;

  container.innerHTML = "";

  mediaLibrary.forEach(item => {
    const div = document.createElement("div");
    div.className = "media-card";

    div.innerHTML = `
      <h4>${item.title}</h4>
      <button onclick="loadToPlayer('${item.url}')">Play</button>
    `;

    container.appendChild(div);
  });
}

// Load into Watch Player
function loadToPlayer(url) {
  localStorage.setItem("currentStream", url);
  alert("Loaded into broadcast player");
}
