const express = require('express');
const router = express.Router();
const skillModel = require('../model/skill');

// GET all tutors listing
router.get('/all', async (req, res) => {
  const listSkill = await skillModel.getAllSkill();
  console.log(listSkill);
  if (listSkill)
    return res
      .status(200)
      .json({
        returncode: 1,
        returnMessage: 'Successfully',
        result: listSkill,
      });
  else return res.status(500).json({ returncode: 0, returnMessage: 'Error' });
});

module.exports = router;
