var express = require('express');
var router = express.Router();
const buffer = require('buffer').Buffer;
const userModel = require('../model/user');
const messageModel = require('../model/message');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const nodemailer = require('nodemailer');
const account = require('../const/emailAcount');
const bcrypt = require('bcrypt');
const contractModel = require('../model/contracts');
const url = require('../config/url')
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
  const user = await userModel.verifyEmail(req.query.token);
  if (user) {
    // return res.status(200).json({
    //   returncode: 1,
    //   returnmessage: 'verified successfully',
    //   user: user,
    // });
    return res.redirect(url.frontend);
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
const sendmailRecover = (req, res, next) => {
  const token = buffer.from(req.body.email).toString('base64');
  const link = `${url.frontend}changepassword?token=` + token;
  const mailOptions = {
    to: req.body.email,
    subject: 'Phục hồi tài khoản UBER FOR TUTOR',
    html:
      'Chào bạn!,<br> Hãy click vào đường dẫn bên dưới để phục hồi mật khẩu tài khoản UBER FOR TUTOR<br><a href=' +
      link +
      '>Click để phục hồi</a>',
  };
  // eslint-disable-next-line no-unused-vars
  smtpTransport.sendMail(mailOptions, (error) => {
    if (error) next(error);
  });
  console.log(mailOptions);
  return token;
};
const sendmailActivate = (req, res, next) => {
  const token = buffer.from(req.body.email).toString('base64');

  const link = 'http://' + req.get('host') + '/user/verify?token=' + token;
  const mailOptions = {
    to: req.body.email,
    subject: 'Kích hoạt tài khoản UBER FOR TUTOR',
    html:
      'Chào bạn!,<br> Hãy click vào đường dẫn bên dưới để xác thực email với tài khoản UBER FOR TUTOR<br><a href=' +
      link +
      '>Click để xác thực</a>',
  };
  console.log(mailOptions);
  smtpTransport.sendMail(mailOptions, (error) => {
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
            returnmessage: 'Updated successfully',
            newUser: newUser,
          });
        }
      } else {
        return res.status(500).json({
          returncode: 0,
          returnmessage: 'Failed to update',
          user: user,
        });
      }
    }
  })(req, res, next);
});
router.put('/changepassword', (req, res, next) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({
        returncode: 0,
        returnmessage: info ? info.message : err,
      });
    } else {
      const info = req.body;
      console.log('curr', user.password);
      console.log('conf', info.currentPassword);
      const isMatch = bcrypt.compareSync(info.currentPassword, user.password);
      if (isMatch) {
        const isUpdated = await userModel.changePassword(user.email, info);

        if (isUpdated) {
          return res.status(200).json({
            returncode: 1,
            returnmessage: 'Changed password successfully',
          });
        } else {
          return res.status(500).json({
            returncode: 0,
            returnmessage: 'Failed to change password',
          });
        }
      } else {
        return res.status(201).json({
          returncode: 0,
          returnmessage: 'Current password is not correct',
        });
      }
    }
  })(req, res, next);
});
router.post('/sendmailreset', async (req, res, next) => {
  const user = await userModel.get(req.body.email);
  if (user && user.isActivated) {
    const token = sendmailRecover(req, res, next);
    const isAdded = userModel.addToken(req.body.email, token);
    if (isAdded) {
      return res.status(200).json({
        returncode: 1,
        returnmessage:
          'Email was sent. Plesae check your email to update your password',
      });
    } else {
      return res.status(500).json({
        returncode: 0,
        returnmessage: 'Failed to send',
      });
    }
  } else {
    return res.status(201).json({
      returncode: 0,
      returnmessage: 'Invalid email or account is not verified with email',
    });
  }
});
router.put('/resetpassword', async (req, res, next) => {
  const info = req.body;
  const user = await userModel.findToken(info.token);
  if (user) {
    const isUpdated = await userModel.changePassword(user.email, info);

    if (isUpdated) {
      return res.status(200).json({
        returncode: 1,
        returnmessage: 'Changed password successfully',
      });
    } else {
      return res.status(500).json({
        returncode: 0,
        returnmessage: 'Failed to change password',
      });
    }
  } else {
    return res.status(201).json({
      returncode: 0,
      returnmessage: 'Unauthorized token',
    });
  }
});
router.get('/messages', async (req, res) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        returnCode: 0,
        returnMessage: info ? info.message : err,
      });
    } else {
      const { email } = user;
      const result = await messageModel.getMessagesByEmail(email);

      const contactList = result.map((element) => {
        element.userOne.email === email
          ? (element.contact = element.userTwo)
          : (element.contact = element.userOne);
        return element;
      });

      if (contactList) {
        return res.status(200).json({
          returnCode: 1,
          returnMessage: 'successfully',
          payload: { contactList, email },
        });
      } else {
        return res.status(500).json({
          returnCode: 0,
          returnMessage: 'Error',
        });
      }
    }
  })(req, res);
});
router.put('/sendmessage', async (req, res) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        returnCode: 0,
        returnMessage: info ? info.message : err,
      });
    } else {
      const io = req.app.get('io');
      const { email } = user;
      const { message, id } = req.body;

      io.in(id).emit('message', { email, message });
      const result = await messageModel.updateMessageArrayById(
        id,
        email,
        message
      );

      if (result)
        return res.status(200).json({
          returnCode: 1,
          returnMessage: 'Update message successfully',
        });
      else
        return res.status(500).json({
          returnCode: 0,
          returnMessage: 'Error',
        });
    }
  })(req, res);
});
router.get('/contract', async (req, res) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        returnCode: 0,
        returnMessage: info ? info.message : err,
      });
    } else {
      const { email } = user;
      const registrationList = await contractModel.getContractByEmail(email);

      if (registrationList) {
        return res.status(200).json({
          returnCode: 1,
          returnMessage: 'successfully',
          registration: registrationList,
        });
      } else {
        return res.status(500).json({
          returnCode: 0,
          returnMessage: 'Error',
        });
      }
    }
  })(req, res);
});
router.put('/messagefromprofile', async (req, res) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        returnCode: 0,
        returnMessage: info ? info.message : err,
      });
    } else {
      const { id } = req.query;
      const { message } = req.body;
      const receiver = await userModel.getById(id);

      if (receiver) {
        const isExist = await messageModel.getExistMessage(
          user.email,
          receiver.email
        );
        const result = isExist[0]
          ? await messageModel.updateMessageArrayById(
              isExist[0]._id,
              user.email,
              message
            )
          : await messageModel.insertNewRoom(user, receiver, message);

        if (result)
          return res.status(200).json({
            returnCode: 1,
            returnMessage: 'Update message successfully',
          });
        else
          return res.status(500).json({
            returnCode: 0,
            returnMessage: 'Error',
          });
      } else {
        return res.status(400).json({
          returnCode: 0,
          returnMessage: 'Error',
        });
      }
    }
  })(req, res);
});
module.exports = router;
