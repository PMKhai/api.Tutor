var express = require('express');
var router = express.Router();
const buffer = require('buffer').Buffer;
const userModel = require('../model/user');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const nodemailer = require('nodemailer');
const account = require('../const/emailAcount');
// POST LOGIN
router.post('/login', (req, res, next) => {
  //const json = { returncode: 0, returnmessage: '' };
  passport.authenticate('login', (err, user, info) => {
    if (err || !user) {
      if (err) {
        return res.status(400).json({
          returncode: 0,
          returnmessage: err,
        });
      }
      return res.status(201).json({
        returncode: 0,
        returnmessage: info.message,
      });
    } else {
      req.logIn(user, (err) => {
        if (err) {
          res.send(err);
        }

        const token = jwt.sign({ id: user.email }, 'jwt-secret');
        return res.status(200).json({
          returncode: 1,
          returnmessage: 'Logged in successfully!',
          token: token,
        });
      });
    }
  })(req, res, next);
});
/* GET users listing. */
router.get('/verify', async (req, res) => {
  const user = await userModel.verifyemail(req.query.id);
  if (user) {
    return res.status(200).json({
      returncode: 1,
      returnmessage: 'verified successfully',
      user: user,
    });
  } else {
    return res.status(401).json({
      returncode: 0,
      returnmessage: 'unauthorized',
    });
  }
});
const smtpTransport = nodemailer.createTransport({
  host: 'gmail.com',
  service: 'Gmail',
  auth: {
    user: account.GMAIL,
    pass: account.GMAIL_PASSWORD,
  },
});
const sendmailRecover = async (req, res, next) => {
  const token = buffer.from(req.body.email).toString('base64');
  const link = 'http://' + req.get('host') + 'user/recoverPassword?id=' + token;
  const mailOptions = {
    to: req.body.email,
    subject: 'Phục hồi tài khoản UBER FOR TUTOR',
    html:
      'Chào bạn!,<br> Hãy click vào đường dẫn bên dưới để phục hồi mật khẩu tài khoản UBER FOR TUTOR<br><a href=' +
      link +
      '>Click để phục hồi</a>',
  };
  // eslint-disable-next-line no-unused-vars
  smtpTransport.sendMail(mailOptions, function(error, info) {
    if (error) next(error);
  });
  return token;
};
const sendmailActivate = (req, res, next) => {
  const token = buffer.from(req.body.email).toString('base64');

  const link = 'http://' + req.get('host') + '/user/verify?id=' + token;
  const mailOptions = {
    to: req.body.email,
    subject: 'Kích hoạt tài khoản UBER FOR TUTOR',
    html:
      'Chào bạn!,<br> Hãy click vào đường dẫn bên dưới để xác thực email với tài khoản UBER FOR TUTOR<br><a href=' +
      link +
      '>Click để xác thực</a>',
  };
  console.log(mailOptions);
  smtpTransport.sendMail(mailOptions, function(error, info) {
    if (error) next(error);
  });
  return token;
};
router.post('/register', async (req, res) => {
  const email = req.body.email;
  const user = req.body;
  console.log('user---', user);
  const isTaken = await userModel.get(email);
  const json = { returncode: 0, returnmessage: '' };
  let stt = 200;
  if (isTaken) {
    stt = 201;
    json['returnmessage'] = 'Email is already taken. Please try another';
  } else {
    const activeToken = sendmailActivate(req, res);
    let result = await userModel.register(user, activeToken);
    if (result) {
      json['returncode'] = 1;
      json['returnmessage'] = 'Register successfully';
    } else {
      stt = 400;
      json['returnmessage'] = 'Register failed';
    }
  }
  res.status(stt).send(json);
});
router.put('/edit', (req, res, next) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        returncode: 0,
        returnmessage: info ? info.message : err,
      });
    } else {
      const info = req.body;
      const isUpdated = await userModel.editInfo(user.email, info);

      if (isUpdated) {
        const newUser = await userModel.get(user.email);
        if (newUser) {
          // newUser.forEach((element) => {
          //   delete element.password;
          // });
          return res.status(200).json({
            returncode: 1,
            returnmessage: 'updated successfully',
            newUser: newUser,
          });
        }
      } else {
        return res.status(500).json({
          returncode: 0,
          returnmessage: 'failed to update',
          user: user,
        });
      }
    }
  })(req, res, next);
});
module.exports = router;
