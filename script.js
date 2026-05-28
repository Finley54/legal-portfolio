const root = document.documentElement;
const swatches = document.querySelectorAll(".swatch");
const filters = document.querySelectorAll(".filter");
const projectCards = document.querySelectorAll(".project-card");
const toast = document.querySelector(".toast");
let toastTimer;

swatches.forEach((button) => {
  button.addEventListener("click", () => {
    const theme = button.dataset.theme;
    root.dataset.theme = theme;
    swatches.forEach((item) => item.classList.toggle("active", item === button));
  });
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("active", item === button));

    projectCards.forEach((card) => {
      const areas = card.dataset.area.split(" ");
      const visible = filter === "all" || areas.includes(filter);
      card.classList.toggle("hidden", !visible);
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
