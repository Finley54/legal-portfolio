const filters = document.querySelectorAll(".filter");
const projectCards = document.querySelectorAll(".project-card");
const projectGroupLabels = document.querySelectorAll(".project-group-label");
const toast = document.querySelector(".toast");
let toastTimer;

const revealTargets = document.querySelectorAll(
  ".proof-card, .section-head, .bridge-card, .project-group-label, .project-card, .featured-report, .report-item, .profile-block, .contact"
);

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
  revealTargets.forEach((element) => element.classList.add("visible"));
} else {
  revealTargets.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.14 }
  );

  revealTargets.forEach((element) => revealObserver.observe(element));
}

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("active", item === button));

    projectCards.forEach((card) => {
      const areas = card.dataset.area.split(" ");
      const visible = filter === "all" || areas.includes(filter);
      card.classList.toggle("hidden", !visible);
    });

    projectGroupLabels.forEach((label) => {
      const group = label.dataset.group;
      const hasVisibleCard = [...projectCards].some((card) => {
        const areas = card.dataset.area.split(" ");
        return areas.includes(group) && !card.classList.contains("hidden");
      });

      label.classList.toggle("hidden", !hasVisibleCard);
    });
  });
});

document.querySelectorAll("[data-toast]").forEach((element) => {
  element.addEventListener("click", (event) => {
    event.preventDefault();
    showToast(element.dataset.toast);
  });
});

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}
