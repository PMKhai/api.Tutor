const { db } = require('../db');
const MESSAGES = 'Messages';

exports.getMessagesByEmail = async (email) => {
  return await db.records
    .collection(MESSAGES)
    .find({ $or: [{ 'userOne.email': email }, { 'userTwo.email': email }] })
    .toArray();
};
