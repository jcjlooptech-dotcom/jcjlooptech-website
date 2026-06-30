const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const dns = require("dns");
require("dotenv").config();

dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = process.env.PORT || 5000;
const ROOT_DIR = path.join(__dirname, "..");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(ROOT_DIR));

const Demo = mongoose.model(
  "Demo",
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      business: { type: String, required: true, trim: true },
      businessType: { type: String, required: true, trim: true },
      service: { type: String, required: true, trim: true },
      message: { type: String, default: "", trim: true },
    },
    { timestamps: true }
  )
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || "").replace(/\s/g, ""),
  },
});

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.get(["/book-demo", "/book-demo.html"], (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "book-demo.html"));
});

app.get(["/thank-you", "/thank-you.html"], (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "thank-you.html"));
});

app.get("/health", (req, res) => {
  res.send("✅ LoopTech backend is running");
});

app.get("/test-email", async (req, res) => {
  try {
    const info = await transporter.sendMail({
      from: `"LoopTech Website" <${process.env.EMAIL_USER}>`,
      to: `${process.env.EMAIL_USER}, ${process.env.ADMIN_EMAIL}`,
      subject: "LoopTech Test Email",
      text: "Email working successfully from LoopTech backend.",
    });

    console.log("✅ Test email sent:", info.messageId);
    res.send("✅ Test email sent. Check Gmail/Spam.");
  } catch (error) {
    console.error("❌ Test Email Error:", error);
    res.status(500).send("❌ Email failed: " + error.message);
  }
});

app.post("/api/book-demo", async (req, res) => {
  try {
    const { name, phone, email, business, businessType, service, message } =
      req.body;

    if (!name || !phone || !email || !business || !businessType || !service) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const demo = await Demo.create({
      name,
      phone,
      email,
      business,
      businessType,
      service,
      message: message || "",
    });

    await sendEmails(demo);

    res.status(201).json({
      success: true,
      message: "Demo request submitted successfully.",
    });
  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

async function sendEmails(data) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  const companyEmail = process.env.COMPANY_EMAIL || process.env.EMAIL_USER;

  await transporter.sendMail({
    from: `"LoopTech Website" <${process.env.EMAIL_USER}>`,
    to: `${adminEmail}, ${process.env.EMAIL_USER}`,
    subject: "New Demo Request - LoopTech",
    html: `
      <h2>New Demo Request</h2>
      <p><b>Name:</b> ${data.name}</p>
      <p><b>Phone:</b> ${data.phone}</p>
      <p><b>Email:</b> ${data.email}</p>
      <p><b>Business:</b> ${data.business}</p>
      <p><b>Industry:</b> ${data.businessType}</p>
      <p><b>Service:</b> ${data.service}</p>
      <p><b>Message:</b> ${data.message || "No message"}</p>
    `,
  });

  await transporter.sendMail({
    from: `"LoopTech Software Solutions" <${process.env.EMAIL_USER}>`,
    to: data.email,
    subject: "Thank You for Booking a Demo - LoopTech",
    html: `
      <h2>Thank You, ${data.name}!</h2>
      <p>Your demo request has been received successfully.</p>
      <p>Our LoopTech team will contact you shortly.</p>
      <hr>
      <p><b>Business:</b> ${data.business}</p>
      <p><b>Industry:</b> ${data.businessType}</p>
      <p><b>Service:</b> ${data.service}</p>
      <br>
      <p><b>LoopTech Software Solutions</b></p>
      <p>Phone: +971 56 727 5589</p>
      <p>Email: ${companyEmail}</p>
      <p>Location: Abu Dhabi, UAE</p>
    `,
  });

  console.log("✅ Emails sent successfully");
}

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI missing");
    if (!process.env.EMAIL_USER) throw new Error("EMAIL_USER missing");
    if (!process.env.EMAIL_PASS) throw new Error("EMAIL_PASS missing");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`✅ Server running: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Startup Error:", error.message);
  }
}

startServer();