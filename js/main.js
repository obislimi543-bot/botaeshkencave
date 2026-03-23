function scrollToSubjects() {
  document.querySelector("#subjects").scrollIntoView({ behavior: "smooth" });
}

document.getElementById("year").textContent = String(new Date().getFullYear());

(function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusEl = document.getElementById("form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const btnLabel = submitBtn ? submitBtn.textContent : "";

  function setStatus(type, message) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.className = "form-status form-status--" + type;
    statusEl.textContent = message;
  }

  function buildMessage(fields) {
    const lines = [
      "— Formular kontakti — Bota e Shkencave",
      "",
      "Emri: " + fields.name,
      "Email: " + fields.email,
      "Telefoni: " + (fields.phone || "—"),
      "Klasa / niveli: " + fields.grade,
      "Lëndët që interesohen: " +
        (fields.subjects.length ? fields.subjects.join(", ") : "—"),
      "",
      "Mesazhi:",
      fields.message || "—",
    ];
    return lines.join("\n");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = form.querySelector("#contact-name")?.value?.trim() || "";
    const email = form.querySelector("#contact-email")?.value?.trim() || "";
    const phone = form.querySelector("#contact-phone")?.value?.trim() || "";
    const grade = form.querySelector("#contact-grade")?.value || "";
    const message = form.querySelector("#contact-message")?.value?.trim() || "";
    const subjects = Array.from(
      form.querySelectorAll('input[name="subject"]:checked')
    ).map((el) => el.value);

    if (!name || !email) {
      setStatus("error", "Ju lutem plotësoni emrin dhe email-in.");
      return;
    }
    if (!grade) {
      setStatus("error", "Ju lutem zgjidhni klasën ose nivelin.");
      return;
    }
    if (subjects.length === 0) {
      setStatus("error", "Zgjidhni të paktën një lëndë që ju intereson.");
      return;
    }

    const payload = { name, email, phone, grade, subjects, message };
    const bodyText = buildMessage(payload);
    const subjectLine = "Bota e Shkencave — kontakt nga " + name;

    const cfg =
      typeof CONTACT_FORM_CONFIG !== "undefined"
        ? CONTACT_FORM_CONFIG
        : { web3formsAccessKey: "", mailtoFallback: "" };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Duke dërguar…";
    }
    setStatus("pending", "Duke dërguar…");

    const accessKey = (cfg.web3formsAccessKey || "").trim();
    const mailtoTo = (cfg.mailtoFallback || "").trim();

    if (accessKey) {
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_key: accessKey,
            subject: subjectLine,
            name: name,
            email: email,
            message: bodyText,
            phone: phone || undefined,
            from_name: name,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.success) {
          setStatus(
            "success",
            "Mesazhi u dërgua. Faleminderit — do t’ju përgjigjemi së shpejti."
          );
          form.reset();
        } else {
          setStatus(
            "error",
            data.message ||
              "Dërgimi dështoi. Provoni përsëri ose na shkruani direkt me email."
          );
        }
      } catch {
        setStatus(
          "error",
          "Gabim rrjeti. Kontrolloni lidhjen ose përdorni email-in direkt."
        );
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = btnLabel;
      }
      return;
    }

    if (mailtoTo) {
      const mailto =
        "mailto:" +
        mailtoTo +
        "?subject=" +
        encodeURIComponent(subjectLine) +
        "&body=" +
        encodeURIComponent(bodyText);
      window.location.href = mailto;
      setStatus(
        "success",
        "Po hapet aplikacioni i emailit me mesazhin tuaj. Ruajeni ose dërgojeni."
      );
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = btnLabel;
      }
      return;
    }

    setStatus(
      "error",
      "Për dërgim me email: hapni js/config.js dhe vendosni web3formsAccessKey (falas: web3forms.com) ose mailtoFallback me adresën tuaj të emailit."
    );
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = btnLabel;
    }
  });
})();
