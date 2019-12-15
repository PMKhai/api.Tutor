const { db } = require('../db');
const CONTRACTS = 'Contracts';

exports.getContractByEmailTutor = async (email) => {
  return await db.records
    .collection(CONTRACTS)
    .find({ tutor: email })
    .toArray();
};
