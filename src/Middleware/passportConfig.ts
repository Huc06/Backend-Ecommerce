import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

export const configurePassport = () => {
  passport.use(
    new LocalStrategy((username: string, password: string, done: Function) => {
      const user = { id: 1, username: "test" }; // Dummy user
      if (username === user.username && password === "password") {
        return done(null, user);
      } else {
        return done(null, false, { message: "Incorrect credentials." });
      }
    })
  );

  passport.serializeUser((user: any, done: Function) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: number, done: Function) => {
    const user = { id: 1, username: "test" }; // Dummy user
    done(null, user);
  });
};
