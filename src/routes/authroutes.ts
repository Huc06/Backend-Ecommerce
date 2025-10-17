import { Router } from "express";
import passport from "passport";

const router: Router = Router();

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

export default router;
