const { db } = require('../db');
const bcrypt = require('bcrypt');
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
exports.register = async (user, token) => {
  const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
  return await db.records.collection(USERS).insertOne({
    email: user.email,
    password: hash,
    isTutor: user.isTutor,
    isActivated: false,
    token,
    name: user.name ? user.name : 'Noname',
    p_number: user.p_number ? user.p_number : '',
    urlAvatar: user.urlAvatar
      ? user.urlAvatar
      : 'https://firebasestorage.googleapis.com/v0/b/caro-react-redux.appspot.com/o/dafault-avatar.jpg?alt=media&token=690645e6-8b99-4542-a8c7-1f4537bd19ae',
    address: {
      province: '',
      district: '',
    },
    overview: '',
    skills: [],
    price: 0,
    rating: 0,
    reviews: [],
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
exports.verifyEmail = async (token) => {
  const user = await db.records.collection(USERS).findOne({ token });
  if (user) {
    await db.records.collection(USERS).updateOne(
      {
        token: token,
      },
      {
        $set: {
          isActivated: true,
        },
        $unset: {
          token: 1,
        },
      },
      {
        upsert: true,
      }
    );
  }
  return user;
};
exports.changePassword = async (email, info) => {
  const hash = await bcrypt.hash(info.newPassword, SALT_ROUNDS);
  return await db.records.collection(USERS).updateOne(
    {
      email: email,
    },
    {
      $set: {
        password: hash,
      },
      $unset: {
        token: 1,
      },
    },
    {
      upsert: true,
    }
  );
};
exports.addToken = async (email, token) => {
  return await db.records.collection(USERS).updateOne(
    {
      email: email,
    },
    {
      $set: {
        token: token,
      },
    },
    {
      upsert: true,
    }
  );
};
exports.findToken = async (token) => {
  return await db.records.collection(USERS).findOne({ token });
};
