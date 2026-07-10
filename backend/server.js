const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const dns = require("dns");

// Always load backend/.env.
// override: true prevents old terminal environment values from being used.
require("dotenv").config({
  path: path.join(__dirname, ".env"),
  override: true,
});

dns.setDefaultResultOrder("ipv4first");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const ROOT_DIR = path.join(__dirname, "..");

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(cors());

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.use(express.static(ROOT_DIR));

/* =====================================================
   MONGODB MODEL
===================================================== */

const demoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    business: {
      type: String,
      required: true,
      trim: true,
    },

    businessType: {
      type: String,
      required: true,
      trim: true,
    },

    service: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Demo =
  mongoose.models.Demo || mongoose.model("Demo", demoSchema);

/* =====================================================
   EMAIL CONFIGURATION
===================================================== */

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_PASS || "").replace(/\s/g, ""),
  },

  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 30000,
});

/* =====================================================
   HELPER FUNCTIONS
===================================================== */

function uniqueEmails(...emails) {
  return [
    ...new Set(
      emails
        .filter(Boolean)
        .map((email) => String(email).trim())
    ),
  ];
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =====================================================
   PAGE ROUTES
===================================================== */

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.get(["/book-demo", "/book-demo.html"], (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "book-demo.html"));
});

app.get(["/thank-you", "/thank-you.html"], (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "thank-you.html"));
});

/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "LoopTech backend is running",
    mongodb:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

/* =====================================================
   TEST EMAIL
===================================================== */

app.get("/test-email", async (req, res) => {
  try {
    const recipients = uniqueEmails(
      process.env.EMAIL_USER,
      process.env.ADMIN_EMAIL
    );

    if (recipients.length === 0) {
      throw new Error("No test email recipient configured.");
    }

    const info = await transporter.sendMail({
      from: `"LoopTech Website" <${process.env.EMAIL_USER}>`,
      to: recipients.join(", "),
      subject: "LoopTech Test Email",

      text:
        "Email is working successfully from the LoopTech backend.",

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>LoopTech Test Email</h2>

          <p>
            Email is working successfully from the LoopTech backend.
          </p>

          <p>
            <b>Website:</b>
            <a href="https://jcjlooptech.com">
              https://jcjlooptech.com
            </a>
          </p>
        </div>
      `,
    });

    console.log("✅ Test email sent:", info.messageId);

    return res
      .status(200)
      .send(
        "✅ Test email sent. Check Gmail, Outlook, Spam and Sent."
      );
  } catch (error) {
    console.error("❌ Test Email Error:", error);

    return res
      .status(500)
      .send(`❌ Email failed: ${error.message}`);
  }
});

/* =====================================================
   BOOK DEMO API
===================================================== */

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

    if (
      !name ||
      !phone ||
      !email ||
      !business ||
      !businessType ||
      !service
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const demo = await Demo.create({
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      business: String(business).trim(),
      businessType: String(businessType).trim(),
      service: String(service).trim(),
      message: message ? String(message).trim() : "",
    });

    console.log(
      "✅ Demo request saved in MongoDB:",
      demo._id.toString()
    );

    await sendEmails(demo);

    return res.status(201).json({
      success: true,
      message: "Demo request submitted successfully.",
    });
  } catch (error) {
    console.error("❌ Demo Request Error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Unable to submit demo request.",
    });
  }
});

/* =====================================================
   SEND ADMIN AND CUSTOMER EMAILS
===================================================== */

async function sendEmails(data) {
  const emailUser = process.env.EMAIL_USER;

  const adminEmail =
    process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

  const companyEmail =
    process.env.COMPANY_EMAIL || process.env.EMAIL_USER;

  const adminRecipients = uniqueEmails(
    adminEmail,
    emailUser
  );

  const safeData = {
    name: escapeHtml(data.name),
    phone: escapeHtml(data.phone),
    email: escapeHtml(data.email),
    business: escapeHtml(data.business),
    businessType: escapeHtml(data.businessType),
    service: escapeHtml(data.service),
    message: escapeHtml(data.message || "No message"),
  };

  /* ---------------- ADMIN EMAIL ---------------- */

  const adminEmailResult = await transporter.sendMail({
    from: `"LoopTech Website" <${emailUser}>`,
    to: adminRecipients.join(", "),
    replyTo: data.email,
    subject: `New Demo Request - ${data.business}`,

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 700px;
          margin: auto;
        "
      >
        <h2 style="color: #072448;">
          New Demo Request
        </h2>

        <table
          cellpadding="10"
          cellspacing="0"
          style="
            border-collapse: collapse;
            width: 100%;
            max-width: 650px;
          "
        >
          <tr>
            <td style="border: 1px solid #dddddd;">
              <b>Name</b>
            </td>

            <td style="border: 1px solid #dddddd;">
              ${safeData.name}
            </td>
          </tr>

          <tr>
            <td style="border: 1px solid #dddddd;">
              <b>Phone</b>
            </td>

            <td style="border: 1px solid #dddddd;">
              ${safeData.phone}
            </td>
          </tr>

          <tr>
            <td style="border: 1px solid #dddddd;">
              <b>Email</b>
            </td>

            <td style="border: 1px solid #dddddd;">
              ${safeData.email}
            </td>
          </tr>

          <tr>
            <td style="border: 1px solid #dddddd;">
              <b>Business</b>
            </td>

            <td style="border: 1px solid #dddddd;">
              ${safeData.business}
            </td>
          </tr>

          <tr>
            <td style="border: 1px solid #dddddd;">
              <b>Industry</b>
            </td>

            <td style="border: 1px solid #dddddd;">
              ${safeData.businessType}
            </td>
          </tr>

          <tr>
            <td style="border: 1px solid #dddddd;">
              <b>Service</b>
            </td>

            <td style="border: 1px solid #dddddd;">
              ${safeData.service}
            </td>
          </tr>

          <tr>
            <td style="border: 1px solid #dddddd;">
              <b>Message</b>
            </td>

            <td style="border: 1px solid #dddddd;">
              ${safeData.message}
            </td>
          </tr>
        </table>

        <p style="margin-top: 20px;">
          This enquiry was submitted through the LoopTech website.
        </p>
      </div>
    `,
  });

  console.log(
    "✅ Admin email sent:",
    adminEmailResult.messageId
  );

  /* ---------------- CUSTOMER EMAIL ---------------- */

  const customerEmailResult = await transporter.sendMail({
    from: `"LoopTech Software Solutions" <${emailUser}>`,
    to: data.email,
    replyTo: companyEmail,
    subject: "Thank You for Booking a Demo - LoopTech",

    html: `
      <div
        style="
          font-family: Arial, sans-serif;
          line-height: 1.7;
          max-width: 650px;
          margin: auto;
        "
      >
        <h2 style="color: #072448;">
          Thank You, ${safeData.name}!
        </h2>

        <p>
          Your demo request has been received successfully.
        </p>

        <p>
          Our LoopTech team will contact you shortly to discuss
          your requirements and arrange your free software
          demonstration.
        </p>

        <div
          style="
            background: #f4f8fc;
            border-radius: 8px;
            padding: 18px;
            margin: 20px 0;
          "
        >
          <p>
            <b>Business:</b>
            ${safeData.business}
          </p>

          <p>
            <b>Industry:</b>
            ${safeData.businessType}
          </p>

          <p>
            <b>Requested Service:</b>
            ${safeData.service}
          </p>
        </div>

        <p>
          <b>LoopTech Software Solutions</b><br>
          Abu Dhabi, UAE<br>
          Phone: +971 56 727 5589<br>
          Email: ${escapeHtml(companyEmail)}<br>

          Website:
          <a href="https://jcjlooptech.com">
            https://jcjlooptech.com
          </a>
        </p>
      </div>
    `,
  });

  console.log(
    "✅ Customer email sent:",
    customerEmailResult.messageId
  );

  console.log("✅ All emails sent successfully");
}

/* =====================================================
   START SERVER
===================================================== */

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is missing in backend/.env"
      );
    }

    if (!process.env.EMAIL_USER) {
      throw new Error(
        "EMAIL_USER is missing in backend/.env"
      );
    }

    if (!process.env.EMAIL_PASS) {
      throw new Error(
        "EMAIL_PASS is missing in backend/.env"
      );
    }

    const mongoHost =
      process.env.MONGODB_URI.match(/@([^/?]+)/)?.[1] ||
      "unknown";

    console.log(
      `🔄 MongoDB host loaded from .env: ${mongoHost}`
    );

    console.log("🔄 Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });

    console.log("✅ MongoDB Connected");

    try {
      await transporter.verify();
      console.log("✅ Gmail SMTP connection successful");
    } catch (emailError) {
      console.error(
        "⚠️ Gmail SMTP verification failed:",
        emailError.message
      );
    }

    app.listen(PORT, () => {
      console.log(
        `✅ Server running: http://localhost:${PORT}`
      );

      console.log(
        `✅ Health check: http://localhost:${PORT}/health`
      );

      console.log(
        `✅ Email test: http://localhost:${PORT}/test-email`
      );

      console.log(
        `✅ Demo page: http://localhost:${PORT}/book-demo.html`
      );
    });
  } catch (error) {
    console.error(
      "❌ Startup Error Name:",
      error.name
    );

    console.error(
      "❌ Startup Error Message:",
      error.message
    );

    console.error(
      "❌ Complete Startup Error:",
      error
    );
  }
}

startServer();