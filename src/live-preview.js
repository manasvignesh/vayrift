(() => {
  "use strict";
  const triggers = [
    ...document.querySelectorAll('[data-live-site="alankarii"]'),
  ];
  if (!triggers.length || typeof HTMLDialogElement === "undefined") return;
  const url = "https://alankarii.vercel.app/";
  let dialog, frame, viewport, previousFocus, modeButtons;
  function setMode(mode) {
    viewport.dataset.mode = mode;
    modeButtons.forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.liveViewport === mode)),
    );
  }
  function close() {
    dialog.close();
  }
  function create() {
    dialog = document.createElement("dialog");
    dialog.className = "live-site-dialog";
    dialog.setAttribute("aria-labelledby", "live-site-heading");
    // This markup is static studio UI; no remote site content is injected into our DOM.
    dialog.innerHTML =
      '<div class="live-site-toolbar"><div><p class="eyebrow">LIVE FOUNDER PROJECT</p><h2 id="live-site-heading">Explore Alankarii</h2></div><div class="live-site-actions"><a href="https://alankarii.vercel.app/" target="_blank" rel="noopener noreferrer">Open in new tab ↗</a><button type="button" class="live-site-close" aria-label="Close live website preview">Close <span aria-hidden="true">×</span></button></div></div><div class="live-site-options"><div role="group" aria-label="Live website viewport"><button type="button" data-live-viewport="desktop" aria-pressed="true">Desktop</button><button type="button" data-live-viewport="mobile" aria-pressed="false">Mobile</button></div><p>You are using the actual site. Scroll and follow its links.</p></div><div class="live-site-viewport" data-mode="desktop"></div><p class="live-site-note">Live external website · Content may change. If the preview is blank or a feature is unavailable here, use “Open in new tab”.</p>';
    viewport = dialog.querySelector(".live-site-viewport");
    modeButtons = [...dialog.querySelectorAll("[data-live-viewport]")];
    modeButtons.forEach((b) =>
      b.addEventListener("click", () => setMode(b.dataset.liveViewport)),
    );
    dialog.querySelector(".live-site-close").addEventListener("click", close);
    dialog.addEventListener("click", (e) => {
      if (e.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        close();
    });
    dialog.addEventListener("close", () => {
      frame?.remove();
      frame = null;
      document.body.classList.remove("live-preview-open");
      previousFocus?.focus({ preventScroll: true });
    });
    document.body.append(dialog);
  }
  triggers.forEach((trigger) =>
    trigger.addEventListener("click", (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0)
        return;
      e.preventDefault();
      if (!dialog) create();
      previousFocus = trigger;
      setMode(trigger.dataset.liveMode === "mobile" ? "mobile" : "desktop");
      frame = document.createElement("iframe");
      frame.title = "Live Alankarii website";
      frame.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-forms allow-popups",
      );
      frame.referrerPolicy = "no-referrer";
      frame.loading = "eager";
      frame.src = url;
      viewport.replaceChildren(frame);
      document.body.classList.add("live-preview-open");
      dialog.showModal();
      dialog.querySelector(".live-site-close").focus();
    }),
  );
})();
