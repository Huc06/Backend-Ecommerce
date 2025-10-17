import { Router } from "express";
import passport from "passport";
const router = Router();
router.post("/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
}));
export default router;
//# sourceMappingURL=authroutes.js.map