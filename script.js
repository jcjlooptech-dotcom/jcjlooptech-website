"use strict";

/* =========================================================
   LOOPTECH SOFTWARE SOLUTIONS
   Main Website JavaScript
========================================================= */

const API_URL =
  "https://looptech-website.onrender.com/api/book-demo";

const ADMIN_WHATSAPP = "971567275589";

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function getElement(id) {
  return document.getElementById(id);
}

function getValue(id) {
  const element = getElement(id);

  return element
    ? element.value.trim()
    : "";
}

function safelyStore(key, value) {
  try {
    localStorage.setItem(
      key,
      typeof value === "string"
        ? value
        : JSON.stringify(value)
    );
  } catch (error) {
    console.warn(
      `Could not save ${key} to localStorage:`,
      error
    );
  }
}

/* =========================================================
   DEMO FORM
========================================================= */

const demoForm = getElement("demoForm");
const submitButton = getElement("submitBtn");

const businessTypeSelect =
  getElement("businessType");

const otherBusinessGroup =
  getElement("otherBusinessGroup");

const otherBusinessInput =
  getElement("otherBusiness");

function setLoading(isLoading) {
  if (!submitButton) {
    return;
  }

  submitButton.disabled = isLoading;

  submitButton.innerHTML = isLoading
    ? '<i class="fas fa-spinner fa-spin"></i> Submitting...'
    : '<i class="fab fa-whatsapp"></i> Submit Request';
}

function createWhatsAppLink(formData) {
  const messageLines = [
    "NEW DEMO REQUEST",
    "",
    `Name: ${formData.name}`,
    `Phone: ${formData.phone}`,
    `Email: ${formData.email}`,
    `Business: ${formData.business}`,
    `Industry: ${formData.businessType}`,
    `Service: ${formData.service}`,
    `Message: ${formData.message || "No message"}`
  ];

  const message =
    messageLines.join("\n");

  return (
    `https://wa.me/${ADMIN_WHATSAPP}` +
    `?text=${encodeURIComponent(message)}`
  );
}

function toggleOtherBusinessField() {
  if (
    !businessTypeSelect ||
    !otherBusinessGroup ||
    !otherBusinessInput
  ) {
    return;
  }

  const isOtherBusiness =
    businessTypeSelect.value ===
    "Other Business";

  otherBusinessGroup.style.display =
    isOtherBusiness
      ? "block"
      : "none";

  otherBusinessInput.required =
    isOtherBusiness;

  if (!isOtherBusiness) {
    otherBusinessInput.value = "";
  }
}

if (businessTypeSelect) {
  businessTypeSelect.addEventListener(
    "change",
    toggleOtherBusinessField
  );

  toggleOtherBusinessField();
}

if (demoForm) {
  demoForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      if (submitButton?.disabled) {
        return;
      }

      const selectedBusinessType =
        getValue("businessType");

      const phoneNumber =
        getValue("phone");

      const countryCode =
        getValue("countryCode");

      const businessType =
        selectedBusinessType ===
        "Other Business"
          ? getValue("otherBusiness")
          : selectedBusinessType;

      const formData = {
        name: getValue("name"),
        phone:
          `${countryCode} ${phoneNumber}`.trim(),
        email: getValue("email"),
        business: getValue("business"),
        businessType,
        service: getValue("service"),
        message: getValue("message")
      };

      const requiredFields = [
        formData.name,
        phoneNumber,
        formData.email,
        formData.business,
        formData.businessType,
        formData.service
      ];

      const hasMissingField =
        requiredFields.some(
          (field) => !field
        );

      if (hasMissingField) {
        alert(
          "Please fill all required fields."
        );

        return;
      }

      setLoading(true);

      const whatsappLink =
        createWhatsAppLink(formData);

      safelyStore(
        "demoData",
        formData
      );

      safelyStore(
        "whatsappLink",
        whatsappLink
      );

      const whatsappWindow =
        window.open(
          whatsappLink,
          "_blank",
          "noopener,noreferrer"
        );

      if (whatsappWindow) {
        whatsappWindow.opener = null;
      }

      try {
        const response = await fetch(
          API_URL,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body: JSON.stringify(
              formData
            )
          }
        );

        if (!response.ok) {
          throw new Error(
            `Server returned ${response.status}`
          );
        }
      } catch (error) {
        console.error(
          "Backend request failed:",
          error
        );
      } finally {
        setLoading(false);

        window.setTimeout(
          () => {
            window.location.href =
              "thank-you.html";
          },
          700
        );
      }
    }
  );
}

/* =========================================================
   RUNNING COUNTER ANIMATION
========================================================= */

const counters =
  document.querySelectorAll(".count");

const counterSection =
  document.querySelector(
    ".counter-section"
  );

let countersStarted = false;

function animateCounter(counter) {
  const target = Number(
    counter.dataset.target || 0
  );

  const suffix =
    counter.dataset.suffix || "";

  const duration = 1800;
  const startTime =
    performance.now();

  if (
    Number.isNaN(target) ||
    target < 0
  ) {
    return;
  }

  function updateCounter(
    currentTime
  ) {
    const elapsed =
      currentTime - startTime;

    const progress = Math.min(
      elapsed / duration,
      1
    );

    const easedProgress =
      1 - Math.pow(
        1 - progress,
        3
      );

    const currentValue =
      Math.floor(
        target * easedProgress
      );

    counter.textContent =
      currentValue.toLocaleString() +
      suffix;

    if (progress < 1) {
      requestAnimationFrame(
        updateCounter
      );
    } else {
      counter.textContent =
        target.toLocaleString() +
        suffix;
    }
  }

  requestAnimationFrame(
    updateCounter
  );
}

function startCounters() {
  if (countersStarted) {
    return;
  }

  countersStarted = true;

  counters.forEach(
    (counter) => {
      animateCounter(counter);
    }
  );
}

if (counters.length > 0) {
  if (
    counterSection &&
    "IntersectionObserver" in window
  ) {
    const counterObserver =
      new IntersectionObserver(
        (entries, observer) => {
          const sectionIsVisible =
            entries.some(
              (entry) =>
                entry.isIntersecting
            );

          if (!sectionIsVisible) {
            return;
          }

          startCounters();

          observer.disconnect();
        },
        {
          threshold: 0.35
        }
      );

    counterObserver.observe(
      counterSection
    );
  } else {
    startCounters();
  }
}

/* =========================================================
   HERO VIDEO AUTOPLAY SUPPORT
========================================================= */

const heroVideo =
  document.querySelector(
    ".hero-bg-video"
  );

function playHeroVideo() {
  if (!heroVideo) {
    return;
  }

  heroVideo.muted = true;
  heroVideo.defaultMuted = true;

  const playPromise =
    heroVideo.play();

  if (
    playPromise &&
    typeof playPromise.catch ===
      "function"
  ) {
    playPromise.catch(
      () => {
        document.addEventListener(
          "click",
          () => {
            heroVideo
              .play()
              .catch(() => {});
          },
          {
            once: true
          }
        );
      }
    );
  }
}

playHeroVideo();

window.addEventListener(
  "load",
  playHeroVideo
);