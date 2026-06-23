const API_URL = "https://looptech-website.onrender.com/api/book-demo";
const ADMIN_WHATSAPP = "971567275589";

const demoForm = document.getElementById("demoForm");
const submitBtn = document.getElementById("submitBtn");

function getValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function setLoading(status) {
  if (!submitBtn) return;

  submitBtn.disabled = status;
  submitBtn.innerHTML = status
    ? "Submitting..."
    : '<i class="fab fa-whatsapp"></i> Submit Request';
}

function openWhatsApp(formData) {
  const whatsappText =
    `NEW DEMO REQUEST\n\n` +
    `Name: ${formData.name}\n` +
    `Phone: ${formData.phone}\n` +
    `Email: ${formData.email}\n` +
    `Business: ${formData.business}\n` +
    `Industry: ${formData.businessType}\n` +
    `Service: ${formData.service}\n` +
    `Message: ${formData.message || "No message"}`;

  window.open(
    `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(whatsappText)}`,
    "_blank"
  );
}

if (demoForm) {
  demoForm.addEventListener("submit", function (e) {
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

    openWhatsApp(formData);

    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    }).catch(function (error) {
      console.error("Submit Error:", error);
    });

    setTimeout(function () {
      window.location.href = "thank-you.html";
    }, 500);
  });
}

document.querySelectorAll(".count").forEach(function (counter) {
  const target = Number(counter.dataset.target || 0);
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 100));

  const timer = setInterval(function () {
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