const { db } = require('../db');
const ObjectID = require('mongodb').ObjectID;
const MESSAGES = 'Messages';

exports.getMessagesByEmail = async (email) => {
  return await db.records
    .collection(MESSAGES)
    .find({ $or: [{ 'userOne.email': email }, { 'userTwo.email': email }] })
    .toArray();
};

exports.getExistMessage = async (firstEmail, secondEmail) => {
  return await db.records
    .collection(MESSAGES)
    .find({
      $or: [
        {
          'userOne.email': firstEmail,
          'userTwo.email': secondEmail,
        },
        {
          'userOne.email': secondEmail,
          'userTwo.email': firstEmail,
        },
      ],
    })
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

exports.insertNewRoom = async (userOne, userTwo, message) => {
  return await db.records.collection(MESSAGES).insertOne({
    userOne: {
      email: userOne.email,
      name: userOne.name,
      urlAvatar: userOne.urlAvatar,
    },
    userTwo: {
      email: userTwo.email,
      name: userTwo.name,
      urlAvatar: userTwo.urlAvatar,
    },
    messages: [{ owner: userOne.email, message }],
  });
};
