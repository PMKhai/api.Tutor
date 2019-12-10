const { db } = require('../db');
const bcrypt = require('bcrypt');
const buffer = require('buffer').Buffer;
const ObjectID = require('mongodb').ObjectID;
const USERS = 'Users';
const SALT_ROUNDS = 10;
const get = async (email) => {
  return await db.records.collection(USERS).findOne({ email });
};
exports.get = get;
exports.vailidPassWord = async (email, password) => {
  const user = await get(email);
  if (user && bcrypt.compareSync(password, user.password)) return user;
  return null;
};
exports.register = async (user) => {
  const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
  const isActiveToken = buffer.from(user.email).toString('base64');
  return await db.records.collection(USERS).insertOne({
    email: user.email,
    password: hash,
    isTutor: user.isTutor,
    isActive: false,
    isActiveToken,
    name: user.name ? user.name : 'Noname',
    p_number: user.p_number ? user.p_number : '',
    urlAvatar: user.urlAvatar
      ? user.urlAvatar
      : 'https://firebasestorage.googleapis.com/v0/b/caro-react-redux.appspot.com/o/default-avatar.jpg?alt=media&token=744e536e-d2a9-4b72-8bf2-e10c55819922',
    address: '',
    overview: '',
    skills: [],
    price: 0,
  });
};
exports.validJwtPayloadId = async (id) => {
  return await db.records.collection(USERS).findOne({ email: id });
};
exports.editInfo = async (email, info) => {
  return await db.records.collection(USERS).updateOne(
    { email: email },
    {
      $set: {
        name: info.name,
        p_number: info.p_number,
        urlAvatar: info.urlAvatar,
        address: info.address,
        overview: info.overview,
        skills: info.skills,
        price: info.price,
      },
    }
  );
};
exports.getAllTutor = async () => {
  return await db.records
    .collection(USERS)
    .find({ isTutor: true })
    .toArray();
};

exports.getById = async (id) => {
  return await db.records.collection(USERS).findOne({ _id: ObjectID(id) });
};