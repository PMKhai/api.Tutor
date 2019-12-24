const express = require('express');
const router = express.Router();
const passport = require('passport');
const userModel = require('../model/user');
const contractModel = require('../model/contracts');
const _ = require('lodash');

// GET all tutors listing
router.get('/all', async (req, res) => {
  const tutorListing = await userModel.getAllTutor();
  console.log(tutorListing);

  tutorListing.forEach((element) => {
    delete element.password;
  });

  // Sort by rating, price
  const result = _.reverse(_.sortBy(tutorListing, ['rating', 'price']));

  console.log('tutor listing---', result);

  if (result)
    return res
      .status(200)
      .json({ returncode: 1, returnMessage: 'Successfully', result });
  else return res.status(500).json({ returncode: 0, returnMessage: 'Error' });
});

// GET top 4 tutor listing
router.get('/toptutor', async (req, res) => {
  const tutorListing = await userModel.getAllTutor();

  // Sort by rating, price
  const result = _.slice(
    _.reverse(_.sortBy(tutorListing, ['rating', 'price'])),
    0,
    4
  );

  result.forEach((element) => {
    delete element.password;
  });

  if (!!result)
    return res
      .status(200)
      .json({ returncode: 1, returnMessage: 'Successfully', topTutor: result });
  else return res.status(500).json({ returncode: 0, returnMessage: 'Error' });
});

// Get tutor by id
router.get('/view', async (req, res) => {
  const { id } = req.query;

  const tutor = await userModel.getById(id);
  delete tutor.password;

  if (!!tutor)
    return res
      .status(200)
      .json({ returncode: 1, returnMessage: 'Successfully', tutorInfo: tutor });
  else return res.status(500).json({ returncode: 0, returnMessage: 'Error' });
});

// Get registration request
router.get('/registration', (req, res) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        returnCode: 0,
        returnMessage: info ? info.message : err,
      });
    } else if (!user.isTutor) {
      return res
        .status(400)
        .json({ returnCode: 0, returnMesage: 'Wrong role' });
    } else {
      const { email } = user;
      const registrationList = await contractModel.getContractByEmailTutor(
        email
      );

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

// Get revenue
router.get('/revenue', (req, res) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        returnCode: 0,
        returnMessage: info ? info.message : err,
      });
    } else if (!user.isTutor) {
      return res
        .status(400)
        .json({ returnCode: 0, returnMesage: 'Wrong role' });
    } else {
      const { email } = user;
      const data = await contractModel.getContractByEmailTutor(email);

      if (data) {
        const revenue = _.filter(data, (o) => {
          return o.totalMoney > 0;
        });

        return res.status(200).json({
          returnCode: 1,
          returnMessage: 'successfully',
          revenue,
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
router.put('/acceptcontract', (req, res) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        returnCode: 0,
        returnMessage: info ? info.message : err,
      });
    } else if (!user.isTutor) {
      return res
        .status(400)
        .json({ returnCode: 0, returnMesage: 'Wrong role' });
    } else {
      const { id } = req.body;
      const result = await contractModel.updateStatusAccept(id);

      if (result) {
        return res.status(200).json({
          returnCode: 1,
          returnMessage: 'successfully',
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
router.put('/canceltcontract', (req, res) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        returnCode: 0,
        returnMessage: info ? info.message : err,
      });
    } else if (!user.isTutor) {
      return res
        .status(400)
        .json({ returnCode: 0, returnMesage: 'Wrong role' });
    } else {
      const { id } = req.body;
      const result = await contractModel.updateStatusCancel(id);

      if (result) {
        return res.status(200).json({
          returnCode: 1,
          returnMessage: 'successfully',
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
module.exports = router;
