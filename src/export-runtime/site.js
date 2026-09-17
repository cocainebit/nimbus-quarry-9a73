document.querySelectorAll("[data-contact-form]").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = form.querySelector('[role="status"]');
    const button = form.querySelector('button[type="submit"]');
    if (location.protocol === "file:") {
      status.textContent =
        "This form needs the included server. Run npm start from the exported folder.";
      return;
    }
    button.disabled = true;
    status.textContent = "Sending your message…";
    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Message could not be sent.");
      form.reset();
      status.textContent = "Thank you. Your message has been received.";
    } catch (error) {
      status.textContent =
        error.message || "Could not send your message. Please try again.";
    } finally {
      button.disabled = false;
    }
  });
});
