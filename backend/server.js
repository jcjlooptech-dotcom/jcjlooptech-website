const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const dns = require("dns");

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

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
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
  mongoose.models.Demo ||
  mongoose.model("Demo", demoSchema);

/* =====================================================
   EMAIL CONFIGURATION
===================================================== */

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: String(process.env.EMAIL_PASS || "").replace(/\s/g, ""),
  },

  pool: true,
  maxConnections: 2,
  maxMessages: 50,

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 25000,
});

/* =====================================================
   HELPERS
===================================================== */

function uniqueEmails(...emails) {
  return [
    ...new Set(
      emails
        .filter(Boolean)
        .map((email) => String(email).trim())
        .filter(Boolean)
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

function cleanValue(value) {
  return String(value || "").trim();
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

app.get("/favicon.ico", (req, res) => {
  res.sendStatus(204);
});

/* =====================================================
   HEALTH CHECK
===================================================== */

app.get("/health", (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    message: "LoopTech backend is running",
    mongodb:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    time: new Date().toISOString(),
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
        <div style="font-family:Arial,sans-serif;line-height:1.7">
          <h2 style="color:#072448">LoopTech Test Email</h2>

          <p>
            Email is working successfully from the
            LoopTech backend.
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
    const name = cleanValue(req.body.name);
    const phone = cleanValue(req.body.phone);
    const email = cleanValue(req.body.email).toLowerCase();
    const business = cleanValue(req.body.business);
    const businessType = cleanValue(req.body.businessType);
    const service = cleanValue(req.body.service);
    const message = cleanValue(req.body.message);

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

    if (!validEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message:
          "Database is temporarily unavailable. Please try again.",
      });
    }

    const demo = await Demo.create({
      name,
      phone,
      email,
      business,
      businessType,
      service,
      message,
    });

    console.log(
      "✅ Demo request saved in MongoDB:",
      demo._id.toString()
    );

    /*
      Return success immediately after MongoDB saves.
      Browser can open WhatsApp and thank-you page now.
    */

    res.setHeader("Cache-Control", "no-store");

    res.status(201).json({
      success: true,
      message: "Demo request submitted successfully.",
      bookingId: demo._id.toString(),
    });

    /*
      Send emails after browser receives success.
    */

    setImmediate(() => {
      sendBookingEmails(demo)
        .then(() => {
          console.log("✅ Booking email process completed");
        })
        .catch((error) => {
          console.error("❌ Booking Email Error:", error);
        });
    });
  } catch (error) {
    console.error("❌ Demo Request Error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message:
          error.message || "Unable to submit demo request.",
      });
    }
  }
});

/* =====================================================
   SEND BOOKING EMAILS
===================================================== */

async function sendBookingEmails(data) {
  const emailUser = process.env.EMAIL_USER;

  const adminEmail =
    process.env.ADMIN_EMAIL || emailUser;

  const companyEmail =
    process.env.COMPANY_EMAIL || emailUser;

  const adminRecipients = uniqueEmails(
    adminEmail,
    emailUser
  );

  const safe = {
    name: escapeHtml(data.name),
    phone: escapeHtml(data.phone),
    email: escapeHtml(data.email),
    business: escapeHtml(data.business),
    businessType: escapeHtml(data.businessType),
    service: escapeHtml(data.service),
    message: escapeHtml(data.message || "No message"),
  };

  const adminMail = transporter.sendMail({
    from: `"LoopTech Website" <${emailUser}>`,
    to: adminRecipients.join(", "),
    replyTo: data.email,
    subject: `New Demo Request - ${data.business}`,

    html: `
      <div
        style="
          max-width:700px;
          margin:auto;
          font-family:Arial,sans-serif;
          line-height:1.7;
          color:#222;
        "
      >
        <h2 style="color:#072448">
          New Demo Request
        </h2>

        <table
          cellpadding="10"
          cellspacing="0"
          style="
            width:100%;
            border-collapse:collapse;
          "
        >
          <tr>
            <td style="border:1px solid #ddd">
              <b>Name</b>
            </td>

            <td style="border:1px solid #ddd">
              ${safe.name}
            </td>
          </tr>

          <tr>
            <td style="border:1px solid #ddd">
              <b>Phone</b>
            </td>

            <td style="border:1px solid #ddd">
              <a href="tel:${safe.phone}">
                ${safe.phone}
              </a>
            </td>
          </tr>

          <tr>
            <td style="border:1px solid #ddd">
              <b>Email</b>
            </td>

            <td style="border:1px solid #ddd">
              <a href="mailto:${safe.email}">
                ${safe.email}
              </a>
            </td>
          </tr>

          <tr>
            <td style="border:1px solid #ddd">
              <b>Business</b>
            </td>

            <td style="border:1px solid #ddd">
              ${safe.business}
            </td>
          </tr>

          <tr>
            <td style="border:1px solid #ddd">
              <b>Industry</b>
            </td>

            <td style="border:1px solid #ddd">
              ${safe.businessType}
            </td>
          </tr>

          <tr>
            <td style="border:1px solid #ddd">
              <b>Service</b>
            </td>

            <td style="border:1px solid #ddd">
              ${safe.service}
            </td>
          </tr>

          <tr>
            <td style="border:1px solid #ddd">
              <b>Message</b>
            </td>

            <td style="border:1px solid #ddd">
              ${safe.message}
            </td>
          </tr>
        </table>

        <p style="margin-top:20px">
          This enquiry was submitted through the
          LoopTech website.
        </p>
      </div>
    `,
  });

  const customerMail = transporter.sendMail({
    from: `"LoopTech Software Solutions" <${emailUser}>`,
    to: data.email,
    replyTo: companyEmail,
    subject: "Thank You for Booking a Demo - LoopTech",

    html: `
      <div
        style="
          max-width:650px;
          margin:auto;
          font-family:Arial,sans-serif;
          line-height:1.7;
          color:#222;
        "
      >
        <h2 style="color:#072448">
          Dear ${safe.name},
        </h2>

        <p>
          Thank you for booking a
          <b>FREE Software Demo</b> with
          <b>LoopTech Software Solutions</b>.
        </p>

        <p>
          We have successfully received your request.
        </p>

        <p>
          Our consultant will contact you shortly to
          schedule your personalized demonstration.
        </p>

        <div
          style="
            margin:22px 0;
            padding:18px;
            border-radius:8px;
            background:#f4f8fc;
          "
        >
          <h3
            style="
              margin-top:0;
              color:#072448;
            "
          >
            Request Summary
          </h3>

          <p>
            <b>Business:</b>
            ${safe.business}
          </p>

          <p>
            <b>Industry:</b>
            ${safe.businessType}
          </p>

          <p>
            <b>Requested Service:</b>
            ${safe.service}
          </p>
        </div>

        <p>
          If you have any questions,
          feel free to contact us.
        </p>

        <hr
          style="
            margin:22px 0;
            border:0;
            border-top:1px solid #ddd;
          "
        >

        <p>
          <b>Phone:</b>
          <a href="tel:+971567275589">
            +971 56 727 5589
          </a>
        </p>

        <p>
          <b>Email:</b>
          <a href="mailto:${escapeHtml(companyEmail)}">
            ${escapeHtml(companyEmail)}
          </a>
        </p>

        <p>
          <b>Website:</b>
          <a href="https://jcjlooptech.com">
            https://jcjlooptech.com
          </a>
        </p>

        <p>
          Thank you for choosing
          <b>LoopTech Software Solutions</b>.
        </p>

        <p>
          Best Regards,
          <br>
          <b>LoopTech Software Solutions</b>
          <br>
          Abu Dhabi, UAE
        </p>
      </div>
    `,
  });

  const [adminResult, customerResult] =
    await Promise.allSettled([
      adminMail,
      customerMail,
    ]);

  if (adminResult.status === "fulfilled") {
    console.log(
      "✅ Admin email sent:",
      adminResult.value.messageId
    );
  } else {
    console.error(
      "❌ Admin email failed:",
      adminResult.reason
    );
  }

  if (customerResult.status === "fulfilled") {
    console.log(
      "✅ Customer email sent:",
      customerResult.value.messageId
    );
  } else {
    console.error(
      "❌ Customer email failed:",
      customerResult.reason
    );
  }

  if (
    adminResult.status === "rejected" &&
    customerResult.status === "rejected"
  ) {
    throw new Error("Both booking emails failed.");
  }

  console.log("✅ Email processing finished");
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

    console.log("🔄 Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    console.log("✅ MongoDB Connected");

    try {
      await transporter.verify();
      console.log("✅ Gmail SMTP connection successful");
    } catch (error) {
      console.error(
        "⚠️ Gmail SMTP verification failed:",
        error.message
      );
    }

    app.listen(PORT, "0.0.0.0", () => {
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
      "❌ Startup Error:",
      error.message
    );

    process.exitCode = 1;
  }
}

/* =====================================================
   PROCESS ERROR HANDLERS
===================================================== */

process.on("unhandledRejection", (error) => {
  console.error(
    "❌ Unhandled Promise Rejection:",
    error
  );
});

process.on("uncaughtException", (error) => {
  console.error(
    "❌ Uncaught Exception:",
    error
  );
});

startServer();