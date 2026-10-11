(function () {
  const AUTH_UNLOCKED_STORAGE_KEY = "aubit.auth.unlocked.v1";
  const AUTH_TOKEN_STORAGE_KEY = "aubit.auth.token.v1";
  const AUTH_POD_PENDING_STORAGE_KEY = "aubit.auth.pod-pending.v1";

  function getOverlay() {
    return document.getElementById("entryAuthOverlay");
  }

  function getFeedback() {
    return document.getElementById("entryAuthFeedback");
  }

  function showFeedback(message) {
    const feedback = getFeedback();
    if (!feedback) {
      return;
    }

    feedback.textContent = message;
    feedback.classList.remove("is-hidden", "is-success");
    feedback.classList.add("is-error");
  }

  function showLogin(message) {
    const overlay = getOverlay();
    if (!overlay) {
      return;
    }

    document.body.classList.add("auth-locked");
    overlay.classList.remove("is-hidden", "ready", "is-busy");
    if (message) {
      showFeedback(message);
    }
  }

  function resetLogin(message) {
    try {
      window.localStorage.removeItem(AUTH_UNLOCKED_STORAGE_KEY);
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(AUTH_POD_PENDING_STORAGE_KEY);
    } catch (_error) {
    }

    showLogin(message || "Login was reset. Try again from here.");
  }

  window.aubitAuthBoot = {
    showLogin,
    resetLogin,
  };

  window.addEventListener("error", () => {
    showLogin("Aubit hit a startup issue, but the login screen is safe. Try again here.");
  });

  window.addEventListener("unhandledrejection", () => {
    showLogin("Aubit hit a startup issue, but the login screen is safe. Try again here.");
  });

  document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("login") || params.has("reset-auth")) {
      resetLogin("Login was reset. Try again from here.");
      return;
    }

    const resetButton = document.getElementById("entryAuthResetButton");
    resetButton?.addEventListener("click", () => {
      resetLogin("Saved login was cleared. Enter your details again.");
    });

    try {
      if (window.localStorage.getItem(AUTH_UNLOCKED_STORAGE_KEY) !== "true") {
        showLogin("");
      }
    } catch (_error) {
      showLogin("");
    }
  }, { once: true });
}());
