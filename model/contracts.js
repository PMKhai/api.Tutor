const { db } = require('../db');
const CONTRACTS = 'Contracts';

exports.getContractByEmailTutor = async (email) => {
  return await db.records
    .collection(CONTRACTS)
    .find({ tutor: email })
    .toArray();
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
    weekylyBonus: contract.weekylyBonus,
    totalHour: contract.totalHour,
    totalMoney: contract.amount,
    status: 'waiting',
    isPaid: false, //nếu đã được thanh toán qua sandbox vnpay thì update thành true
    dayOfPayment: contract.dayOfPayment, // ngày thanh toán qua sandbox vn pay
    dayOfHire: contract.dayOfHire,
  });
};
