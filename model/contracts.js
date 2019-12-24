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
exports.getContractById = async (idContract) => {
  return await db.records
    .collection(CONTRACTS)
    .find({ idContract: idContract })
    .toArray();
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
    idContract: contract.idContract, // mã hợp đồng dùng cho việc truy xuất đồng thời mã
    // này cũng trùng với mã thanh toán ở sanbox vn pay tiện cho việc kiểm tra về sau
    tutor: contract.tutor,
    student: contract.student,
    hourlyPrice: contract.hourlyPrice,
    weeklyLimit: contract.weeklyLimit,
    monthlyLimit: contract.monthlyLimit,
    weekylyBonus: contract.weeklyBonus,
    totalHour: contract.totalHour,
    totalMoney: contract.amount,
    status: 'pending',
    isPaid: false, //nếu đã được thanh toán qua sandbox vnpay thì update thành true
    dayOfPayment: contract.dayOfPayment, // ngày thanh toán qua sandbox vn pay
    dayOfHire: contract.dayOfHire,
  });
};
