const { db } = require('../db');
const SKILLS = 'Skills';
exports.getAllSkill = async () => {
    return await db.records
      .collection(SKILLS)
      .find({})
      .toArray();
  };