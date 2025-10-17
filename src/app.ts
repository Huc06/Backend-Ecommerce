import express from "express";
import session from "express-session";
import flash from "connect-flash";
import passport from "passport";
import { configurePassport } from "./Middleware/passportConfig.js"; // Import passport config
import authRoutes from "./routes/authroutes.js"; // Import authentication routes

const app: express.Express = express();

// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));

//Confugure session middleware
app.use(
  session({
    secret: process.env.SECRET_KEY || "your_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

configurePassport(); //Call the passport configuration function

app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); //use flash middleware

// Use authentication routes
app.use("/auth", authRoutes);

export default app;
