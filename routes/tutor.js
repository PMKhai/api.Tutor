const express = require('express');
const router = express.Router();
const userModel = require('../model/user');
const _ = require('lodash');

// GET all tutors listing
router.get('/all', async (req, res) => {
  const tutorListing = await userModel.getAllTutor();
  console.log(tutorListing);

  if (!!tutorListing)
    return res
      .status(200)
      .json({ returncode: 0, returnMessage: 'Successfully', tutorListing });
  else return res.status(500).json({ returncode: 1, returnMessage: 'Error' });
});

// GET top 4 tutor listing
router.get('/toptutor', async (req, res) => {
  const tutorListing = await userModel.getAllTutor();

  const lenght = tutorListing.leght;
  const result = _.slice(
    _.sortBy(tutorListing, ['rating']),
    lenght - 4,
    lenght
  );
  console.log('top tutor---', result);

  if (!!result)
    return res
      .status(200)
      .json({ returncode: 0, returnMessage: 'Successfully', topTutor: result });
  else return res.status(500).json({ returncode: 1, returnMessage: 'Error' });
});

module.exports = router;
