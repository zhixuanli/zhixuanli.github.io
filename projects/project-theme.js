(function () {
  var root = document.documentElement;
  var themeToggle = document.getElementById("theme-toggle");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var themeAnimation;
  var copyAnimation;
  var copyTimer;
  var systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    return root.dataset.theme === "dark" ? "dark" : "light";
  }

  function renderThemeButton() {
    if (!themeToggle) return;
    var dark = currentTheme() === "dark";
    themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    themeToggle.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
    themeToggle.innerHTML = '<i data-lucide="' + (dark ? "sun" : "moon") + '" aria-hidden="true"></i>';
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  if (themeToggle) themeToggle.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("zl-theme", next);
    renderThemeButton();
    if (themeAnimation) themeAnimation.cancel();
    var icon = themeToggle.querySelector("svg");
    if (!reducedMotion.matches && icon) {
      themeAnimation = icon.animate([
        { opacity: 0, transform: "rotate(-30deg) scale(.8)" },
        { opacity: 1, transform: "rotate(0) scale(1)" }
      ], { duration: 280, easing: "cubic-bezier(.22,1,.36,1)" });
    }
  });

  systemTheme.addEventListener("change", function (event) {
    if (!localStorage.getItem("zl-theme")) {
      root.dataset.theme = event.matches ? "dark" : "light";
      renderThemeButton();
    }
  });

  var copyButton = document.getElementById("copy-bibtex");
  var copyLabel = copyButton && copyButton.querySelector("span");
  var bibtexCode = document.getElementById("bibtex-code");

  if (copyButton) copyButton.addEventListener("click", function () {
    navigator.clipboard.writeText(bibtexCode.textContent).then(function () {
      window.clearTimeout(copyTimer);
      copyLabel.textContent = "Copied";
      copyButton.classList.add("is-copied");
      if (copyAnimation) copyAnimation.cancel();
      if (!reducedMotion.matches) {
        copyAnimation = copyLabel.animate([{ opacity: .5 }, { opacity: 1 }], { duration: 160, easing: "ease-out" });
      }
      copyTimer = window.setTimeout(function () {
        copyButton.classList.remove("is-copied");
        copyLabel.textContent = "Copy";
      }, 1800);
    });
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }

  if (document.querySelector(".project-nav")) {
    var optics = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    optics.setAttribute("aria-hidden", "true");
    optics.setAttribute("width", "0");
    optics.setAttribute("height", "0");
    optics.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    optics.innerHTML = '<defs><filter id="lg-circle" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%"><feImage result="map" x="0" y="0" width="44" height="44" preserveAspectRatio="none" href="data:image/png;base64,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"/><feDisplacementMap in="SourceGraphic" in2="map" scale="18" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';
    document.body.appendChild(optics);
    root.dataset.refraction = "on";
  }
  reducedMotion.addEventListener("change", function () {
    if (reducedMotion.matches) {
      if (themeAnimation) themeAnimation.cancel();
      if (copyAnimation) copyAnimation.cancel();
    }
  });
  renderThemeButton();
}());
