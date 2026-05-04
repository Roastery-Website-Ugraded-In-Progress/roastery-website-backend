import express from "express";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import specificProducts from "./specificProducts.js";
import itemRouter from "./Item.js";
import userProductsRouter from "./userProducts.js";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const saltRounds = 10;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const frontendOrigin = process.env.FRONTEND_URL.replace(/\/$/, "");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (origin && origin.includes("netlify.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      sameSite: "none",
    },
  })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new Strategy(
    { usernameField: "username", passwordField: "password" },
    async (username, password, cb) => {
      try {
        const { data: users, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", username);
        if (error) return cb(error);
        if (!users || users.length === 0) return cb(null, false);

        const user = users[0];
        bcrypt.compare(password, user.password, (err, valid) => {
          if (err) return cb(err);
          return cb(null, valid ? user : false);
        });
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.serializeUser((user, cb) => cb(null, user));
passport.deserializeUser((user, cb) => cb(null, user));

// Auth routes
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    req.login(user, (err) => {
      if (err) return res.status(500).json({ message: "Login failed" });
      res.status(200).json({ message: "Login successful", user });
    });
  })(req, res, next);
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out" });
  });
});

app.post("/signUp", async (req, res) => {
  const { username: email, password, nameOfTheUser } = req.body;
  try {
    const { data: existingUsers } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);
    if (existingUsers.length > 0)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        { email, password: hashedPassword, nameoftheuser: nameOfTheUser },
      ])
      .select()
      .single();
    if (error) return res.status(500).json({ message: "Registration failed" });

    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ message: "Login failed" });
      res
        .status(200)
        .json({ message: "Registration successful", user: newUser });
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

app.use("/api/products", specificProducts);
app.use("/api", itemRouter);
app.use("/api", userProductsRouter);

app.get("/debug", (req, res) => {
  res.json({
    status: "Server running",
    time: new Date().toISOString(),
    database: "Supabase",
    endpoints: [
      "/login",
      "/signUp",
      "/logout",
      "/api/products/:category",
      "/api/item/:category/:product",
      "/api/userProducts?email=...",
    ],
  });
});

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
