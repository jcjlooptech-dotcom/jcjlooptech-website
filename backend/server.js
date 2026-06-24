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

const allowedOrigins = [
  "http://localhost:5000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "https://jcjlooptech.com",
  "https://www.jcjlooptech.com",
  "https://jcjlooptech-website.vercel.app",
  "https://looptech-website.onrender.com",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(ROOT_DIR));

const demoSchema = new mongoose.Schema(
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
);

const Demo = mongoose.model("Demo", demoSchema);

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
  res.status(200).json({
    success: true,
    message: "LoopTech backend is running",
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
      message,
    } = req.body;

    if (!name || !phone || !email || !business || !businessType || !service) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const demoRequest = await Demo.create({
      name,
      phone,
      email,
      business,
      businessType,
      service,
      message: message || "",
    });

    res.status(201).json({
      success: true,
      message: "Demo request submitted successfully.",
    });

    setImmediate(() => {
      sendEmails(demoRequest).catch((error) => {
        console.log("Email Error:", error.message);
      });
    });
  } catch (error) {
    console.error("Server Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    family: 4,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendEmails(data) {
  const transporter = createTransporter();

  if (!transporter) {
    console.log("Email skipped: EMAIL_USER or EMAIL_PASS missing");
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  const companyEmail = process.env.COMPANY_EMAIL || "jcjlooptech@outlook.com";

  await transporter.sendMail({
    from: `"LoopTech Website" <${process.env.EMAIL_USER}>`,
    to: adminEmail,
    subject: "New Demo Request - LoopTech",
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;color:#222;line-height:1.6">
        <h2 style="color:#081c3a">New Demo Request</h2>
        <p><b>Name:</b> ${data.name}</p>
        <p><b>Phone:</b> ${data.phone}</p>
        <p><b>Email:</b> ${data.email}</p>
        <p><b>Business:</b> ${data.business}</p>
        <p><b>Industry:</b> ${data.businessType}</p>
        <p><b>Service:</b> ${data.service}</p>
        <p><b>Message:</b> ${data.message || "No message"}</p>
      </div>
    `,
  });

  await transporter.sendMail({
    from: `"LoopTech Software Solutions" <${process.env.EMAIL_USER}>`,
    to: data.email,
    subject: "Thank You for Booking a Demo - LoopTech",
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;color:#222;line-height:1.6">
        <h2 style="color:#081c3a">Thank You, ${data.name}!</h2>
        <p>Your demo request has been received successfully.</p>
        <p>Our LoopTech team will contact you shortly.</p>

        <hr />

        <p><b>Your Demo Details</b></p>
        <p><b>Business:</b> ${data.business}</p>
        <p><b>Industry:</b> ${data.businessType}</p>
        <p><b>Service:</b> ${data.service}</p>

        <br />

        <p><b>LoopTech Software Solutions</b></p>
        <p>Phone: +971 56 727 5589</p>
        <p>Email: ${companyEmail}</p>
        <p>Location: Abu Dhabi, UAE</p>
      </div>
    `,
  });

  console.log("Emails sent successfully");
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