/* Liquid Glass motion enhancement for the homepage. */
(function () {
  "use strict";

  var control = document.querySelector(".segmented-control");
  var buttons = Array.from(control.querySelectorAll(".filter-button"));
  var reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  var thumb = document.createElement("span");
  thumb.className = "selection-glass";
  thumb.setAttribute("aria-hidden", "true");
  control.prepend(thumb);
  control.classList.add("has-fluid-selection");

  var selected = control.querySelector(".is-active");
  var x = { value: 0, velocity: 0, target: 0 };
  var width = { value: 0, velocity: 0, target: 0 };
  var frame = 0;
  var previousTime = 0;
  var themeAnimation;

  function measure() {
    x.target = selected.offsetLeft;
    width.target = selected.offsetWidth;
    thumb.style.top = selected.offsetTop + "px";
    thumb.style.height = selected.offsetHeight + "px";
  }

  function paint() {
    thumb.style.transform = "translate3d(" + x.value + "px,0,0)";
    thumb.style.width = width.value + "px";
  }

  function settle() {
    cancelAnimationFrame(frame);
    frame = 0;
    [x, width].forEach(function (axis) {
      axis.value = axis.target;
      axis.velocity = 0;
    });
    paint();
  }

  // Exact critically damped spring: retarget without discarding velocity.
  function advance(axis, dt) {
    var omega = 24;
    var displacement = axis.value - axis.target;
    var coefficient = axis.velocity + omega * displacement;
    var decay = Math.exp(-omega * dt);
    axis.value = axis.target + (displacement + coefficient * dt) * decay;
    axis.velocity = (axis.velocity - omega * coefficient * dt) * decay;
  }

  function tick(time) {
    var dt = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    advance(x, dt);
    advance(width, dt);
    paint();
    if ([x, width].every(function (axis) {
      return Math.abs(axis.value - axis.target) < 0.1 && Math.abs(axis.velocity) < 0.5;
    })) {
      settle();
    } else {
      frame = requestAnimationFrame(tick);
    }
  }

  control.addEventListener("click", function (event) {
    var button = event.target.closest(".filter-button");
    if (!button) return;
    if (button === selected) return;
    selected = button;
    measure();
    if (reducedMotion.matches) {
      settle();
      return;
    }
    if (!frame) {
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  });

  // The existing handler updates the theme and replaces the icon synchronously.
  document.getElementById("theme-toggle").addEventListener("click", function () {
    if (themeAnimation) themeAnimation.cancel();
    if (reducedMotion.matches) return;
    var icon = this.querySelector("svg");
    if (!icon) return;
    themeAnimation = icon.animate([
      { opacity: 0, transform: "rotate(-30deg) scale(.8)" },
      { opacity: 1, transform: "rotate(0) scale(1)" }
    ], { duration: 280, easing: "cubic-bezier(.22,1,.36,1)" });
  });

  reducedMotion.addEventListener("change", function () {
    if (reducedMotion.matches) {
      measure();
      settle();
      if (themeAnimation) themeAnimation.cancel();
    }
  });

  // Resize/font changes realign immediately; they are not filter interactions.
  var resize = new ResizeObserver(function () {
    measure();
    settle();
  });
  buttons.forEach(function (button) { resize.observe(button); });
  resize.observe(control);
  measure();
  settle();
}());
