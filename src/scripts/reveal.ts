// Minimal reveal-on-scroll for Project DELTΔ.
(function () {
  const items = document.querySelectorAll(".reveal");
  document.documentElement.classList.add("has-reveal");

  function isInViewport(el: Element): boolean {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
  }

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -30px 0px",
    },
  );

  items.forEach((el) => {
    if (isInViewport(el)) {
      el.classList.add("is-visible");
    }
    observer.observe(el);
  });
})();
