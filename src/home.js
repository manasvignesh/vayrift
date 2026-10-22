(() => {
  const video = document.querySelector(".home-film-frame video"),
    button = document.querySelector(".home-film-toggle");
  if (!video || !button) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const update = () => {
    button.setAttribute(
      "aria-label",
      video.paused ? "Play background film" : "Pause background film",
    );
    button.firstElementChild.textContent = video.paused ? "▷" : "Ⅱ";
  };
  if (reduced.matches) {
    video.removeAttribute("autoplay");
    video.pause();
  }
  button.addEventListener("click", () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
  video.addEventListener("play", update);
  video.addEventListener("pause", update);
  reduced.addEventListener("change", () => {
    if (reduced.matches) video.pause();
  });
  update();
})();

// Show genuine desktop/mobile screenshots of the same founder project.
(() => {
  const stage = document.querySelector(".premium-project-stage");
  if (!stage) return;
  const controls = [...document.querySelectorAll("[data-preview-mode]")];
  controls.forEach((button) =>
    button.addEventListener("click", () => {
      const mode = button.dataset.previewMode;
      stage.dataset.preview = mode;
      controls.forEach((b) =>
        b.setAttribute("aria-pressed", String(b === button)),
      );
      stage.querySelector(".premium-desktop-screen").hidden =
        mode !== "desktop";
      stage.querySelector(".premium-mobile-screen").hidden = mode !== "mobile";
    }),
  );
})();
