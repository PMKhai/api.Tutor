const { db } = require('../db');
const ObjectID = require('mongodb').ObjectID;
const CONTRACTS = 'Contracts';

exports.getContractByEmail = async (email) => {
  const forTutor = await db.records
    .collection(CONTRACTS)
    .find({ tutor: email })
    .toArray();
  if (forTutor.length > 0) {
    return forTutor;
  } else {
    return await db.records
      .collection(CONTRACTS)
      .find({ student: email })
      .toArray();
  }
};
exports.getContractByOderId = async (orderId) => {
  return await db.records.collection(CONTRACTS).findOne({ orderId }); 
};

exports.addOrderId = async (id, orderId) => {
  return await db.records.collection(CONTRACTS).updateOne(
    { _id: ObjectID(id) },
    { $set: { orderId: orderId } },
    {
      upsert: true,
    }
  );
};
exports.updateStatus = async (id, status) => {
  return await db.records.collection(CONTRACTS).updateOne(
    { _id: ObjectID(id) },
    { $set: { status: status } },
    {
      upsert: true,
    }
  );
};
exports.updateDone = async (id, endDate) => {
  return await db.records.collection(CONTRACTS).updateOne(
    { _id: ObjectID(id) },
    { $set: { status: 'done', endDate: endDate } },
    {
      upsert: true,
    }
  );
};
exports.updatePayment = async (orderId, dayOfPayment) => {
  return await db.records.collection(CONTRACTS).updateOne(
    { orderId: orderId },
    { $set: { isPaid: true, status: 'doing', dayOfPayment: dayOfPayment } },
    {
      upsert: true,
    }
  );
};
exports.report = async (contract) => {
  return await db.records.collection(CONTRACTS).updateOne(
    { _id: ObjectID(contract._id) },
    { $set: { status: contract.status, reason: contract.reason } },
    {
      upsert: true,
    }
  );
};

exports.addContract = async (contract) => {
  return await db.records.collection(CONTRACTS).insertOne({
    // này cũng trùng với mã thanh toán ở sanbox vn pay tiện cho việc kiểm tra về sau
    tutor: contract.tutor,
    student: contract.student,
    hourlyPrice: contract.hourlyPrice,
    weeklyLimit: contract.weeklyLimit,
    monthlyLimit: contract.monthlyLimit,
    weekylyBonus: contract.weeklyBonus,
    totalHour: contract.totalHour,
    totalMoney: contract.totalMoney,
    status: 'pending',
    isPaid: false, //nếu đã được thanh toán qua sandbox vnpay thì update thành true
    oderId: null,
    dayOfHire: contract.dayOfHire,
    dayOfPayment: null, // ngày thanh toán qua sandbox vn pay
    startDate: contract.startDate,
    endDate: null,
    reason: null,
  });
};
