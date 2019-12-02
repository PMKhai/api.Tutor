var express = require("express");
var router = express.Router();
const userModel = require("../model/user");
const jwt = require("jsonwebtoken");
const passport = require("passport");
// POST LOGIN
router.post("/login", (req, res, next) => {
  passport.authenticate("login", (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        returncode: 0,
        returnmessage: info ? info.message : err
      });
    } else {
      req.logIn(user, err => {
        if (err) {
          res.send(err);
        }

        const token = jwt.sign({ id: user.email }, "jwt-secret");
        return res.status(200).json({
          returncode: 1,
          returnmessage: "Logged in successfully!",
          token: token
        });
      });
    }
  })(req, res, next);
});
/* GET users listing. */
router.get("/", function(req, res) {
  res.send("respond with a resource");
});

router.post("/register", async (req, res) => {
  const email = req.body.email;
  const user = req.body;
  console.log("user---",user);
  const isTaken = await userModel.get(email);
  const json = { returncode: 0, returnmessage: "" };
  let stt = 400;
  if (isTaken) {
    json["returnmessage"] = "Email is already taken. Please try another";
  } else {
    let result = await userModel.register(user);
    if (result) {
      json["returncode"] = 1;
      json["returnmessage"] = "Register successfully";
      stt = 200;
    } else {
      json["returnmessage"] = "Register failed";
    }
  }
  res.status(stt).send(json);
});
router.put("/edit", (req, res, next) => {
  passport.authenticate("jwt", { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        returncode: 0,
        returnmessage: info ? info.message : err
      });
    } else {
      const info = req.body;
      const isUpdated = await userModel.editInfo(user.email, info);

      if (isUpdated) {
        const newUser = await userModel.get(user.email);
        if (newUser) {
          return res.status(200).json({
            returncode: 1,
            returnmessage: "updated successfully",
            newUser: newUser
          });
        }
      } else {
        return res.status(500).json({
          returncode: 0,
          returnmessage: "failed to update",
          user: user
        });
      }
    }
  })(req, res, next);
});
module.exports = router;
