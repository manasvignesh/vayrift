(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  // Text entrance works with existing headings, without adding a framework runtime.
  if (!reduce.matches) {
    document
      .querySelectorAll(".hero h1,.home-hero h1,.lf-intro h1,.subpage-hero h1")
      .forEach((h) => {
        let i = 0;
        const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach((node) => {
          const fragment = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach((word) => {
            if (!word.trim()) {
              fragment.append(document.createTextNode(word));
              return;
            }
            const outer = document.createElement("span");
            outer.className = "split-word";
            const inner = document.createElement("span");
            inner.textContent = word;
            inner.style.setProperty("--word-delay", i++ * 65 + "ms");
            outer.append(inner);
            fragment.append(outer);
          });
          node.replaceWith(fragment);
        });
      });
  }
  const cards = document.querySelectorAll(
    ".lf-package,.lf-team-grid article,.page-path-grid>a,.brief-guide button",
  );
  cards.forEach((card) => {
    card.classList.add("spotlight-card");
    card.addEventListener("pointermove", (e) => {
      if (reduce.matches || e.pointerType === "touch") return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--pointer-x", e.clientX - r.left + "px");
      card.style.setProperty("--pointer-y", e.clientY - r.top + "px");
      if (card.hasAttribute("data-tilt"))
        card.style.transform =
          "perspective(900px) rotateX(" +
          -(e.clientY - r.top - r.height / 2) / 60 +
          "deg) rotateY(" +
          (e.clientX - r.left - r.width / 2) / 75 +
          "deg)";
    });
    card.addEventListener("pointerleave", () => {
      if (card.hasAttribute("data-tilt")) card.style.transform = "";
    });
  });
  if (matchMedia("(pointer:fine)").matches) {
    document
      .querySelectorAll(".btn-primary,.nav-contact,.lf-package-end>a")
      .forEach((button) => {
        button.classList.add("magnetic-target");
        button.addEventListener("pointermove", (e) => {
          if (reduce.matches) return;
          const r = button.getBoundingClientRect();
          button.style.transform =
            "translate(" +
            (e.clientX - r.left - r.width / 2) * 0.13 +
            "px," +
            (e.clientY - r.top - r.height / 2) * 0.2 +
            "px)";
        });
        button.addEventListener(
          "pointerleave",
          () => (button.style.transform = ""),
        );
      });
  }
  if (!reduce.matches && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.06 },
    );
    document
      .querySelectorAll(
        ".studio-manifesto,.work-specs,.brief-guide,.service-picker,.lf-process li",
      )
      .forEach((e, i) => {
        if (e.getBoundingClientRect().top > innerHeight) {
          e.classList.add("motion-enter");
          e.style.setProperty("--enter-delay", (i % 4) * 60 + "ms");
          observer.observe(e);
        }
      });
    reduce.addEventListener("change", () => {
      if (reduce.matches) {
        document
          .querySelectorAll(".motion-enter")
          .forEach((e) => e.classList.add("in-view"));
        observer.disconnect();
      }
    });
  }
  let scheduled = false;
  const update = () => {
    scheduled = false;
    if (reduce.matches) return;
    const image = document.querySelector(".studio-window>img");
    if (image) {
      const r = image.parentElement.getBoundingClientRect();
      image.style.setProperty(
        "--scroll-shift",
        Math.max(
          -18,
          Math.min(18, (innerHeight / 2 - r.top - r.height / 2) * 0.055),
        ) + "px",
      );
    }
  };
  addEventListener(
    "scroll",
    () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();
  document.querySelectorAll("[data-work-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      const type = button.dataset.workFilter;
      document.querySelectorAll("[data-work-filter]").forEach((b) => {
        const active = b === button;
        b.classList.toggle("active", active);
        b.setAttribute("aria-pressed", String(active));
      });
      document
        .querySelectorAll("[data-work-type]")
        .forEach(
          (section) =>
            (section.hidden =
              type !== "all" && section.dataset.workType !== type),
        );
    }),
  );
  document.querySelectorAll("[data-brief]").forEach((button) =>
    button.addEventListener("click", () => {
      const field = document.getElementById("inq-service");
      if (field) field.value = button.dataset.brief;
      document.querySelectorAll("[data-brief]").forEach((b) => {
        const selected = b === button;
        b.classList.toggle("active", selected);
        b.setAttribute("aria-pressed", String(selected));
      });
      const note = document.querySelector(".brief-feedback");
      if (note)
        note.textContent =
          button.querySelector("strong").textContent +
          " selected. " +
          (document.getElementById("inquiry-fields")?.disabled
            ? "Submission is still disabled until a real contact address is configured."
            : "Add a few details to your brief below.");
    }),
  );
  // Do not play background video for hidden service panels.
  const sync = () =>
    document.querySelectorAll(".lf-service video").forEach((v) => {
      const visible = !v.closest(".lf-service").hidden;
      if (visible && !reduce.matches) v.play().catch(() => {});
      else v.pause();
    });
  document
    .querySelectorAll("[data-service-tab]")
    .forEach((b) =>
      b.addEventListener("click", () => requestAnimationFrame(sync)),
    );
  sync();
})();
