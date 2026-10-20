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
