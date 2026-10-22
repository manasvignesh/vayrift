(() => {
  "use strict";
  const select = document.querySelector("#sector-pick"),
    rows = [...document.querySelectorAll("[data-sector]")],
    result = document.querySelector("#sector-result");
  if (select) {
    select.value = "listing-pack";
    const update = () => {
      rows.forEach(
        (row) =>
          (row.hidden =
            !!select.value &&
            row.querySelector("strong").textContent.replace(/:$/, "") !==
              select.selectedOptions[0].textContent),
      );
      if (result)
        result.textContent = select.value
          ? "Recommended starting offer for " +
            select.options[select.selectedIndex].text +
            ". Confirm the fit with us before ordering."
          : "A starting suggestion, not an assessment of your business.";
    };
    select.addEventListener("change", update);
    update();
  }
  const service = document.querySelector("#inq-service");
  const whatsapp = document.querySelector("[data-whatsapp]");
  if (whatsapp) {
    const base = whatsapp.href.split("?")[0];
    const update = () => {
      const label =
        service?.selectedOptions[0]?.textContent?.split(" — ")[0] ||
        "your services";
      whatsapp.href =
        base +
        "?text=" +
        encodeURIComponent("Hi VAYRIFT, I'd like to know more about " + label);
    };
    service?.addEventListener("change", update);
    window.addEventListener("load", update);
    setTimeout(update, 400);
    update();
  }
})();
