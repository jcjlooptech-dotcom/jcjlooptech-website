const API_URL = "https://looptech-website.onrender.com/api/book-demo";
const ADMIN_WHATSAPP = "971567275589";

const demoForm = document.getElementById("demoForm");
const submitBtn = document.getElementById("submitBtn");

function getValue(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function setLoading(status) {
  if (!submitBtn) return;

  submitBtn.disabled = status;
  submitBtn.innerHTML = status
    ? "Submitting..."
    : '<i class="fab fa-whatsapp"></i> Submit Request';
}

function createWhatsAppLink(data) {
  const message =
    `NEW DEMO REQUEST\n\n` +
    `Name: ${data.name}\n` +
    `Phone: ${data.phone}\n` +
    `Email: ${data.email}\n` +
    `Business: ${data.business}\n` +
    `Industry: ${data.businessType}\n` +
    `Service: ${data.service}\n` +
    `Message: ${data.message || "No message"}`;

  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

if (demoForm) {
  demoForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = {
      name: getValue("name"),
      phone: getValue("phone"),
      email: getValue("email"),
      business: getValue("business"),
      businessType: getValue("businessType"),
      service: getValue("service"),
      message: getValue("message")
    };

    if (
      !formData.name ||
      !formData.phone ||
      !formData.email ||
      !formData.business ||
      !formData.businessType ||
      !formData.service
    ) {
      alert("Please fill all required fields");
      return;
    }

    setLoading(true);

    localStorage.setItem("demoData", JSON.stringify(formData));
    localStorage.setItem("whatsappLink", createWhatsAppLink(formData));

    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    }).catch((error) => {
      console.error("Submit Error:", error);
    });

    window.location.href = "/thank-you.html";
  });
}

document.querySelectorAll(".count").forEach((counter) => {
  const target = Number(counter.dataset.target || 0);
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 100));

  const timer = setInterval(() => {
    current += step;

    if (current >= target) {
      counter.innerText =
        target === 500 ? "500+" :
        target === 6 ? "6+" :
        target === 99 ? "99%" :
        target;

      clearInterval(timer);
    } else {
      counter.innerText = current;
    }
  }, 20);
});