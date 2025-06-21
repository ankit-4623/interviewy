const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const interviewRoutes = require("./routes/interview");
dotenv.config();

const app = express();

// CORS config
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.JWT_token_Secreat,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB error", err));

// Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });
    if (!user) {
        user = await User.create({
            name: profile.displayName,
            email,
            search_history: []
        });
    }
    done(null, user);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// Auth Routes
app.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

app.get("/auth/google/callback", 
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/?error=auth_failed"
  }), 
  (req, res) => {
    // ✅ Redirect after login
    res.redirect("http://localhost:5173/dashboard");
  }
);


// Get User Infoj
app.get("/api/user", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing token" });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_token_Secreat);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ id: user._id, name: user.name, email: user.email, phone: user.phone });
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
});

// Logout
app.post("/auth/logout", (req, res) => {
    req.logout(() => {
        req.session.destroy(() => {
            res.clearCookie("connect.sid");
            res.json({ message: "Logged out" });
        });
    });
});
app.use("/api/interview", interviewRoutes);
// Start server
const PORT = process.env.PORT ;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
