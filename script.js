const API_URL = "https://looptech-website.onrender.com/api/book-demo";


const ADMIN_WHATSAPP = "971567275589";

const demoForm = document.getElementById("demoForm");
const submitBtn = document.getElementById("submitBtn");

const businessTypeSelect = document.getElementById("businessType");
const otherBusinessGroup = document.getElementById("otherBusinessGroup");
const otherBusinessInput = document.getElementById("otherBusiness");

const getValue = (id) => document.getElementById(id)?.value.trim() || "";

const setLoading = (loading) => {
  if (!submitBtn) return;

  submitBtn.disabled = loading;
  submitBtn.innerHTML = loading
    ? "Submitting..."
    : '<i class="fab fa-whatsapp"></i> Submit Request';
};

const createWhatsAppLink = (data) => {
  const message = `
NEW DEMO REQUEST

Name: ${data.name}
Phone: ${data.phone}
Email: ${data.email}
Business: ${data.business}
Industry: ${data.businessType}
Service: ${data.service}
Message: ${data.message || "No message"}
`;

  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;
};

if (businessTypeSelect && otherBusinessGroup && otherBusinessInput) {
  businessTypeSelect.addEventListener("change", () => {
    const isOther = businessTypeSelect.value === "Other Business";

    otherBusinessGroup.style.display = isOther ? "block" : "none";
    otherBusinessInput.required = isOther;

    if (!isOther) {
      otherBusinessInput.value = "";
    }
  });
}

if (demoForm) {
  demoForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const selectedBusinessType = getValue("businessType");

    const formData = {
      name: getValue("name"),
      phone: `${getValue("countryCode")} ${getValue("phone")}`,
      email: getValue("email"),
      business: getValue("business"),
      businessType:
        selectedBusinessType === "Other Business"
          ? getValue("otherBusiness")
          : selectedBusinessType,
      service: getValue("service"),
      message: getValue("message"),
    };

    const requiredFields = [
      formData.name,
      getValue("phone"),
      formData.email,
      formData.business,
      formData.businessType,
      formData.service,
    ];

    if (requiredFields.some((field) => !field)) {
      alert("Please fill all required fields.");
      return;
    }

    setLoading(true);

    const whatsappLink = createWhatsAppLink(formData);

    localStorage.setItem("demoData", JSON.stringify(formData));
    localStorage.setItem("whatsappLink", whatsappLink);

    window.open(whatsappLink, "_blank");

    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    }).catch((error) => {
      console.error("Backend Error:", error);
    });

    setTimeout(() => {
      window.location.href = "thank-you.html";
    }, 800);
  });
}

const slides = document.querySelectorAll(".hero-slider .slide");
let currentSlide = 0;

if (slides.length > 1) {
  setInterval(() => {
    slides[currentSlide].classList.remove("active");
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add("active");
  }, 3500);
}

document.querySelectorAll(".count").forEach((counter) => {
  const target = Number(counter.dataset.target || 0);
  let current = 0;
  const step = Math.max(1, Math.ceil(target / 100));

  const timer = setInterval(() => {
    current += step;

    if (current >= target) {
      counter.innerText =
        target === 500
          ? "500+"
          : target === 6
          ? "6+"
          : target === 99
          ? "99%"
          : target;

      clearInterval(timer);
    } else {
      counter.innerText = current;
    }
  }, 20);
});