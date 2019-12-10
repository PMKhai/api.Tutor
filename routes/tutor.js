const express = require('express');
const router = express.Router();
const userModel = require('../model/user');
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

module.exports = router;