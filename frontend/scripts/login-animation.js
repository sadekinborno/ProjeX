// Enhanced form interactions
document.addEventListener("DOMContentLoaded", function () {
  // Password toggle functionality
  const togglePassword = document.getElementById("toggle-password");
  const passwordInput = document.getElementById("password");

  togglePassword.addEventListener("click", function () {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    // Animate the icon
    this.style.transform = "scale(0.8)";
    setTimeout(() => {
      this.style.transform = "scale(1)";
    }, 150);
  });

  // Remember me checkbox animation
  const checkbox = document.querySelector('input[type="checkbox"]');
  const checkboxBg = checkbox.parentNode.querySelector("div:nth-child(2)");
  const checkboxIcon = checkbox.parentNode.querySelector("svg");

  checkbox.addEventListener("change", function () {
    if (this.checked) {
      checkboxBg.style.opacity = "1";
      checkboxIcon.style.opacity = "1";
    } else {
      checkboxBg.style.opacity = "0";
      checkboxIcon.style.opacity = "0";
    }
  });

  // Form submission animation
  const form = document.getElementById("login-form");
  const loadingOverlay = document.getElementById("loading-overlay");

  form.addEventListener("submit", function (e) {
    // Show loading overlay
    loadingOverlay.classList.remove("hidden");

    // Add some delay for demonstration (remove in production)
    setTimeout(() => {
      loadingOverlay.classList.add("hidden");
    }, 2000);
  });

  // Input focus animations
  const inputs = document.querySelectorAll(
    'input[type="text"], input[type="password"]'
  );
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.parentNode.style.transform = "translateY(-2px)";
    });

    input.addEventListener("blur", function () {
      this.parentNode.style.transform = "translateY(0)";
    });
  });
});
