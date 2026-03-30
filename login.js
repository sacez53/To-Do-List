const form = document.getElementById("login-form");
const codeInput = document.getElementById("code-input");
const errorBox = document.getElementById("login-error");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const entered = codeInput.value.trim();
  if (!entered) return;

  try {
    // Chargement du code depuis config.json
    const res = await fetch("./config.json");
    const config = await res.json();

    if (entered === String(config.code)) {
      // Authentification réussie
      sessionStorage.setItem("auth", "true");
      window.location.href = "./index.html";
    } else {
      // Mauvais code
      errorBox.classList.add("visible");
      codeInput.value = "";
      codeInput.focus();

      // Cache le message après 3 secondes
      setTimeout(() => errorBox.classList.remove("visible"), 3000);
    }
  } catch (err) {
    errorBox.textContent = "Erreur de chargement. Vérifiez config.json.";
    errorBox.classList.add("visible");
    console.error(err);
  }
});

// Masque l'erreur dès que l'utilisateur retape
codeInput.addEventListener("input", () => {
  errorBox.classList.remove("visible");
});
