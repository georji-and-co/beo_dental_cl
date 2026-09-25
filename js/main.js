(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function setNav(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNav(false);
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setNav(false);
    });
  }

  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (reduced) {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-in");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      observer.observe(el);
    });

    var heroBg = document.querySelector(".hero__bg");
    var wide = window.matchMedia("(min-width: 1200px)");
    if (heroBg && wide.matches) {
      var ticking = false;
      window.addEventListener(
        "scroll",
        function () {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(function () {
            var shift = Math.min(window.scrollY, window.innerHeight) * 0.12;
            heroBg.style.transform = "translate3d(0, " + shift + "px, 0)";
            ticking = false;
          });
        },
        { passive: true }
      );
    }
  }

  if (!reduced && finePointer && window.VanillaTilt) {
    window.VanillaTilt.init(document.querySelectorAll("[data-tilt]"), {
      max: 4,
      speed: 800,
      glare: false,
      scale: 1,
      gyroscope: false
    });
  }

  if (!reduced && finePointer) {
    var cursor = document.querySelector(".cursor");
    if (cursor) {
      document.body.classList.add("has-cursor");
      var shown = false;
      window.addEventListener("pointermove", function (event) {
        cursor.style.transform =
          "translate3d(" + event.clientX + "px, " + event.clientY + "px, 0) translate(-50%, -50%)";
        if (!shown) {
          cursor.classList.add("is-shown");
          shown = true;
        }
      });
      document.querySelectorAll("a, button").forEach(function (el) {
        el.addEventListener("pointerenter", function () {
          cursor.classList.add("is-hot");
        });
        el.addEventListener("pointerleave", function () {
          cursor.classList.remove("is-hot");
        });
      });
    }
  }
})();
