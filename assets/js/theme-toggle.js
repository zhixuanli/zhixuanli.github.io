(function () {
  "use strict";

  var storageKey = "theme-preference";
  var root = document.documentElement;
  var button = document.querySelector(".theme-toggle");
  var colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  var themeColor = document.querySelector('meta[name="theme-color"]');

  if (!button) {
    return;
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function getCurrentTheme() {
    var storedTheme = getStoredTheme();
    return storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : (colorScheme.matches ? "dark" : "light");
  }

  function updateButton(theme) {
    var nextTheme = theme === "dark" ? "light" : "dark";
    var label = "Switch to " + nextTheme + " mode";
    var icon = button.querySelector("i");

    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";

    if (themeColor) {
      themeColor.setAttribute("content", theme === "dark" ? "#111418" : "#ffffff");
    }
  }

  function setTheme(theme) {
    root.setAttribute("data-theme", theme);

    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {}

    updateButton(theme);
  }

  button.addEventListener("click", function () {
    setTheme(getCurrentTheme() === "dark" ? "light" : "dark");
  });

  colorScheme.addEventListener("change", function () {
    if (!getStoredTheme()) {
      updateButton(getCurrentTheme());
    }
  });

  updateButton(getCurrentTheme());
}());
