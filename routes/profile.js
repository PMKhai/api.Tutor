const express = require("express");
const router = express.Router();
const passport = require("passport");
router.get("/", (req, res, next) => {
  passport.authenticate('jwt',{session:false}, (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        returncode:0,
        returnmessage: info ? info.message : err,
        user: user
      });
    } else {
      // user.forEach((element) => {
      //   delete element.password;
      // });
      return res.status(200).json({
        returncode: 1,
        returnmessage: "profile founded",
        user:user,
      });
    }
  })(req, res,next);
});


module.exports = router;
