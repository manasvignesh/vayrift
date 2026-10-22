(() => {
  "use strict";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector(".masthead");
  let ticking = false;
  const scrollState = () => {
    ticking = false;
    header?.classList.toggle("studio-scrolled", scrollY > 12);
  };
  addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(scrollState);
      }
    },
    { passive: true },
  );
  scrollState();
  // Reveal only once, with content visible even when animation or JavaScript is unavailable.
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach(({ isIntersecting, target }) => {
          if (!isIntersecting) return;
          observer.unobserve(target);
          if (!reduced.matches && target.animate)
            target.animate(
              [
                { opacity: 0.72, transform: "translateY(14px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              { duration: 580, easing: "cubic-bezier(.22,.68,0,1.02)" },
            );
        }),
      { threshold: 0.08 },
    );
    document
      .querySelectorAll(
        ".home-start-card,.offer-card,.sample-card,.reference-notes,.contact-sidebar,.lf-team-grid article,.home-project,.premium-opening-note,.how-we-price",
      )
      .forEach((el) => {
        if (el.getBoundingClientRect().top > innerHeight * 0.9)
          observer.observe(el);
      });
    reduced.addEventListener("change", () => {
      if (reduced.matches)
        document.getAnimations().forEach((a) => {
          try {
            a.finish();
          } catch {
            a.cancel();
          }
        });
      document
        .querySelectorAll(".magnetic-target,[data-tilt]")
        .forEach((el) => (el.style.transform = ""));
    });
  }
  // Opening native disclosures remains keyboard accessible; no click interception.
  document.querySelectorAll("details").forEach((details) =>
    details.addEventListener("toggle", () => {
      if (details.open && !reduced.matches) {
        const p = details.querySelector("p");
        p?.animate?.(
          [
            { opacity: 0.3, transform: "translateY(-4px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 260, easing: "ease-out" },
        );
      }
    }),
  );
  document
    .querySelectorAll(
      ".inquiry-form input,.inquiry-form textarea,.inquiry-form select",
    )
    .forEach((field) => {
      const update = () =>
        field.classList.toggle("field-filled", !!field.value);
      field.addEventListener("input", update);
      field.addEventListener("change", update);
      update();
    });
  // If navigation was restored from the browser cache, reveal state cannot leave content hidden.
  addEventListener("pageshow", () => {
    document.querySelectorAll(".reveal-ready,.motion-enter").forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight) {
        el.classList.add("is-visible", "in-view");
      }
    });
  });
})();
