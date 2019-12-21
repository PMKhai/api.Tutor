const { db } = require('../db');
const ObjectID = require('mongodb').ObjectID;
const MESSAGES = 'Messages';

exports.getMessagesByEmail = async (email) => {
  return await db.records
    .collection(MESSAGES)
    .find({ $or: [{ 'userOne.email': email }, { 'userTwo.email': email }] })
    .toArray();
};

exports.updateMessageArrayById = async (id, email, message) => {
  return await db.records
    .collection(MESSAGES)
    .updateOne(
      { _id: ObjectID(id) },
      { $push: { messages: { owner: email, message } } }
    );
};
