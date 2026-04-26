const complexTrigger = document.getElementById("complex-trigger");
const complexModal = document.getElementById("complex-modal");
const complexClose = document.getElementById("complex-close");

function openModal() {
  complexModal.classList.add("active");
  complexModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  complexModal.classList.remove("active");
  complexModal.setAttribute("aria-hidden", "true");
}

complexTrigger?.addEventListener("click", openModal);
complexClose?.addEventListener("click", closeModal);
complexModal?.addEventListener("click", (e) => {
  if (e.target === complexModal) {
    closeModal();
  }
});
