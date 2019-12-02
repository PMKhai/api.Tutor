const passport = require("passport");
const passportJWT = require("passport-jwt");

const ExtractJWT = passportJWT.ExtractJwt;

const LocalStrategy = require("passport-local").Strategy;
const JWTStrategy = passportJWT.Strategy;
const userModel = require("../model/user");
passport.use(
  "login",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      session: false
    },
    async (email, password, done) => {
      try {
        const user = await userModel.vailidPassWord(email, password);
        if (user) {
          return done(null, user);
        }
        return done(null, false, {
          message: "Incorrect username or password."
        });
      } catch (ex) {
        return done(ex);
      }
    }
  )
);

passport.use(
  "jwt",
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: "jwt-secret"
    },
    async (jwt_payload, done) => {
      try {
        const user = await userModel.validJwtPayloadId(jwt_payload.id);
        if (user) {
          return done(null, user);
        }
        return done(null, false, {
          message: "not found"
        });
      } catch (ex) {
        return done(ex);
      }
    }
  )
);
module.exports = app => {
  app.use(passport.initialize());
  passport.use(LocalStrategy);
  passport.use(JWTStrategy);
  passport.serializeUser((user, done) => {
    return done(null, user);
  });
  passport.deserializeUser((user, done) => {
    return done(null, user);
  });
};
