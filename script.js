const API_URL = "https://looptech-website.onrender.com/api/book-demo";

const demoForm = document.getElementById("demoForm");
const submitBtn = document.getElementById("submitBtn");
const successBox = document.getElementById("successBox");

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setLoading(status) {
  if (!submitBtn) return;

  submitBtn.disabled = status;
  submitBtn.innerHTML = status
    ? "Submitting..."
    : '<i class="fab fa-whatsapp"></i> Submit Request';
}

if (demoForm) {
  demoForm.addEventListener("submit", async (e) => {
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

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        alert(result.message || "Submission failed. Please try again.");
        setLoading(false);
        return;
      }

      if (successBox) {
        successBox.style.display = "block";
        successBox.innerHTML = `✅ Thank you <b>${formData.name}</b>! Your demo request has been received successfully.`;
      }

      demoForm.reset();

      if (result.whatsapp) {
        window.open(result.whatsapp, "_blank");
      }

      setTimeout(() => {
        window.location.href = "thank-you.html";
      }, 1200);

    } catch (error) {
      console.error("Submit Error:", error);
      alert("Server error. Please try WhatsApp.");
      setLoading(false);
    }
  });
}

/* Counter Animation */
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