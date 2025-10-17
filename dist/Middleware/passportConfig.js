import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
export const configurePassport = () => {
    passport.use(new LocalStrategy((username, password, done) => {
        const user = { id: 1, username: "test" }; // Dummy user
        if (username === user.username && password === "password") {
            return done(null, user);
        }
        else {
            return done(null, false, { message: "Incorrect credentials." });
        }
    }));
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser((id, done) => {
        const user = { id: 1, username: "test" }; // Dummy user
        done(null, user);
    });
};
//# sourceMappingURL=passportConfig.js.map