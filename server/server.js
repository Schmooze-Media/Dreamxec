const dotenv = require("dotenv");
require("./instrument");
const Sentry = require("@sentry/node");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const AppError = require("./src/utils/AppError");
const globalErrorHandler = require("./src/middleware/error.middleware");
const RedisStore = require("connect-redis").default;
const redis = require("./src/services/redis.service");
const cleanupOtpRedisKeys = require("./src/utils/redisOTPCleanup");
const morgan = require("morgan");
const requestId = require("./src/middleware/requestId.middleware");
const compression = require("compression");

const prisma = require("./src/config/prisma");

// 🔥 NEW
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const expireTransfers = require("./src/cron/expireTransfers");

// Load env
dotenv.config();

const CLIENT_URL = process.env.CLIENT_URL;
console.log("CLIENT_URL =", CLIENT_URL);

// --------------------------------------------
// IMPORT ROUTES
// --------------------------------------------
const authRoutes = require("./src/api/auth/auth.routes");
const userProjectRoutes = require("./src/api/user-projects/user-project.routes");
const donorProjectRoutes = require("./src/api/donor-projects/donor-project.routes");
const userRoutes = require("./src/api/users/user.routes");
const donationRoutes = require("./src/api/donations/donation.routes");
const adminRoutes = require("./src/api/admin/admin.routes");
const applicationRoutes = require("./src/api/applications/application.routes");
const clubVerificationRoutes = require("./src/api/club-verification/clubVerification.routes");
const clubReferralRoutes = require("./src/api/club-referral/clubReferral.routes");
const adminClubReferralRoutes = require("./src/api/admin-club/adminClubReferral.routes");
const adminClubVerificationRoutes = require("./src/api/admin-club/adminClubVerification.routes");
const newsletterRoutes = require("./src/api/newsletter/newsletter.routes");
const wishlistRoutes = require("./src/api/wishlist/wishlist.routes");
const uploadRoutes = require("./src/api/upload/upload.routes");
const otpRoutes = require("./src/api/otp/otp.routes");
const studentVerificationRoutes = require("./src/api/studentVerification/studentVerification.routes");
const healthRoutes = require("./src/routes/health.routes");
const adminRedisRoutes = require("./src/api/admin/adminRedis.routes");
const clubRoutes = require("./src/api/clubs/club.routes");
const campaignCommentRoutes = require("./src/api/campaign-comments/campaignComment.routes");
const seoRoutes = require("./src/api/seo/seo.routes");
const profileRoutes = require("./src/api/profile/profile.routes");
const mentorRoutes = require("./src/api/mentor/mentor.routes");

// Passport config
require("./src/config/passport");

const app = express();

/* ======================================================
   🔐 SECURITY LAYER
====================================================== */

// Helmet (security headers)
app.use(helmet());

// Global Rate Limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});
app.use(limiter);

/* ======================================================
   🧾 REQUEST SETUP
====================================================== */

app.use(requestId);
app.use(compression());

if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

/* ======================================================
   🌐 CORS (STRICT)
====================================================== */
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || origin === CLIENT_URL) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* ======================================================
   🔐 SESSION (REDIS)
====================================================== */
app.use(
  session({
    store: new RedisStore({
      client: redis,
      prefix: "dreamxec:sess:",
    }),
    name: "dreamxec.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

/* ======================================================
   📦 BODY PARSER
====================================================== */
app.use(express.json());

/* ======================================================
   🔐 PASSPORT
====================================================== */
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  if (req.user) {
    Sentry.setUser({
      id: req.user.id,
      email: req.user.email,
    });
  }
  next();
});

/* ======================================================
   🩺 HEALTH
====================================================== */
app.use("/api", healthRoutes);

/* ======================================================
   🧪 DEV TOKEN
====================================================== */
app.get("/dev/gen-token", (req, res) => {
  const generateDevToken = require("./src/utils/devToken");

  const mockUser = {
    id: "67acb1c5d40f13b3be90f7f2",
    role: "USER",
  };

  const token = generateDevToken(mockUser.id, mockUser.role);

  res.json({
    success: true,
    token,
  });
});

/* ======================================================
   🏠 ROOT
====================================================== */
app.get("/", (req, res) => {
  if (CLIENT_URL) return res.redirect(CLIENT_URL);
  res.json({ service: "dreamxec backend", status: "running" });
});

/* ======================================================
   📡 API ROUTES
====================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/user-projects", userProjectRoutes);
app.use("/api/donor-projects", donorProjectRoutes);
app.use("/api/users", userRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminRedisRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/club-verification", clubVerificationRoutes);
app.use("/api/club-referral", clubReferralRoutes);
app.use("/api/admin/referrals", adminClubReferralRoutes);
app.use("/api/admin/club-verifications", adminClubVerificationRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/student-verification", studentVerificationRoutes);
app.use("/api/payments", require("./src/api/payments/payment.routes"));
app.use("/api", campaignCommentRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/", seoRoutes);

/* ======================================================
   ❌ 404 HANDLER
====================================================== */
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

/* ======================================================
   🔴 SENTRY ERROR HANDLER
====================================================== */
Sentry.setupExpressErrorHandler(app);

app.use((err, req, res, next) => {
  next(err);
});

/* ======================================================
   🌍 GLOBAL ERROR HANDLER
====================================================== */
app.use(globalErrorHandler);

/* ======================================================
   🧹 REDIS CLEANUP
====================================================== */
redis.on("ready", async () => {
  console.log("✅ Redis connected");

  if (process.env.CLEAN_REDIS_ON_BOOT === "true") {
    try {
      const deleted = await cleanupOtpRedisKeys();
      console.log(`🧹 Redis OTP cleanup done. Deleted ${deleted} keys.`);
    } catch (err) {
      console.error("❌ Redis OTP cleanup failed:", err);
    }
  }
});

/* ======================================================
   ⏳ CRON JOBS
====================================================== */
cron.schedule("*/10 * * * *", async () => {
  console.log("⏳ Running transfer expiry job...");
  await expireTransfers();
});

/* ======================================================
   🚀 START SERVER
====================================================== */
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  prisma
    .$connect()
    .then(() => {
      console.log("Database connected successfully");
      console.log(`🚀 Server running on port ${PORT}`);
    })
    .catch((err) => console.error("Database connection failed:", err));
});

/* ======================================================
   🛑 GRACEFUL SHUTDOWN
====================================================== */
process.on("SIGINT", async () => {
  console.log("🛑 Graceful shutdown...");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received...");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});