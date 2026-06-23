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
const ADMIN_WHATSAPP = "971567275589";
const ROOT_DIR = path.join(__dirname, "..");

app.use(cors({
  origin: [
    "http://localhost:5000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://jcjlooptech.com",
    "https://www.jcjlooptech.com",
    "https://looptech-website-beryl.vercel.app",
    "https://looptech-website.onrender.com"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(ROOT_DIR));

const demoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    business: { type: String, required: true },
    businessType: { type: String, required: true },
    service: { type: String, required: true },
    message: { type: String, default: "" }
  },
  { timestamps: true }
);

const Demo = mongoose.model("Demo", demoSchema);

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.get("/book-demo", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "book-demo.html"));
});

app.get("/book-demo.html", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "book-demo.html"));
});

app.get("/thank-you", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "thank-you.html"));
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "LoopTech backend is running"
  });
});

app.post("/api/book-demo", async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      business,
      businessType,
      service,
      message
    } = req.body;

    if (!name || !phone || !email || !business || !businessType || !service) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    const demoRequest = await Demo.create({
      name,
      phone,
      email,
      business,
      businessType,
      service,
      message: message || ""
    });

    await sendEmails(demoRequest);

    const whatsappText =
      `NEW DEMO REQUEST\n\n` +
      `Name: ${name}\n` +
      `Phone: ${phone}\n` +
      `Email: ${email}\n` +
      `Business: ${business}\n` +
      `Industry: ${businessType}\n` +
      `Service: ${service}\n` +
      `Message: ${message || "No message"}`;

    res.status(201).json({
      success: true,
      message: "Thank you! Your demo request submitted successfully.",
      whatsapp: `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(whatsappText)}`
    });
  } catch (error) {
    console.error("Server Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
});

async function sendEmails(data) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Email skipped: EMAIL_USER or EMAIL_PASS missing");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      family: 4,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"LoopTech Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
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
      `
    });

    await transporter.sendMail({
      from: `"LoopTech Software Solutions" <${process.env.EMAIL_USER}>`,
      to: data.email,
      subject: "Thank You For Contacting LoopTech",
      html: `
        <div style="font-family:Segoe UI,sans-serif;padding:20px;color:#222">
          <h2 style="color:#081c3a">Thank You, ${data.name}!</h2>
          <p>Your demo request has been submitted successfully.</p>
          <p>Our LoopTech team will contact you shortly.</p>

          <hr>

          <h3>Your Request Details</h3>
          <p><b>Business:</b> ${data.business}</p>
          <p><b>Industry:</b> ${data.businessType}</p>
          <p><b>Service:</b> ${data.service}</p>

          <br>

          <p><b>LoopTech Software Solutions</b></p>
          <p>Phone: +971 56 727 5589</p>
          <p>Email: jcjlooptech@gmail.com</p>
          <p>Location: Abu Dhabi, UAE</p>
        </div>
      `
    });

    console.log("Emails sent successfully");
  } catch (error) {
    console.log("Email Error:", error.message);
  }
}

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI missing");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup Error:", error.message);
    process.exit(1);
  }
}

startServer();