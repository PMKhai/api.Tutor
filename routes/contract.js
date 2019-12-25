/**
 * Created by vinhnt on 6/16/2017.
 */

const express = require('express');
const router = express.Router();
// const $ = require('jquery');
const payment = require('../config/payment');
const dateFormat = require('dateformat');
const sha256 = require('sha256');
const querystring = require('qs');
const contractModel = require('../model/contracts');
const url = require('../config/url');
const nodemailer = require('nodemailer');
const account = require('../const/emailAcount');

const smtpTransport = nodemailer.createTransport({
  host: 'gmail.com',
  service: 'Gmail',
  auth: {
    user: account.GMAIL,
    pass: account.GMAIL_PASSWORD,
  },
});
const sendmailPaymentToTutor = (contract) => {
  const mailOptions = {
    to: contract.tutor,
    subject: 'THANH TOÁN HỢP ĐỒNG UBER FOR TUTOR',
    html: `Chào bạn!,<br>Học viên của bạn đã thanh toán thành công cho hợp đồng Uber For Tutor.
    Thông tin hợp đồng:<br>
    -Ngày bắt đầu: ${contract.startDate}<br>
    -Tổng tiền: ${contract.totalMoney * 23000} VNĐ <br>
    -Tổng số giờ: ${contract.totalHour} giờ<br>
    -Email học viên: ${contract.student}<br>`,
  };
  smtpTransport.sendMail(mailOptions, (error) => {
    if (error) return error;
  });
  return null;
};
const sendmailPaymentToStudent = (contract) => {
  const mailOptions = {
    to: contract.student,
    subject: 'THANH TOÁN HỢP ĐỒNG UBER FOR TUTOR',
    html: `Chào bạn!,<br>Bạn đã thanh toán thành công cho hợp đồng Uber For Tutor.<br>
       Thông tin hợp đồng:<br>
      -Ngày bắt đầu: ${contract.startDate}<br>
      -Tổng tiền: ${contract.totalMoney * 23000} VNĐ <br>
      -Tổng số giờ: ${contract.totalHour} giờ<br>
      -Email giáo viên: ${contract.tutor}<br>`,
  };
  smtpTransport.sendMail(mailOptions, (error) => {
    if (error) return error;
  });
  return null;
};
router.get('/', function(req, res, next) {
  res.render('orderlist', { title: 'Danh sách đơn hàng' });
});

router.get('/create_payment_url', function(req, res, next) {
  //var dateFormat = require('dateformat');
  var date = new Date();

  var desc =
    'Thanh toan don hang thoi gian: ' + dateFormat(date, 'yyyy-mm-dd HH:mm:ss');
  res.render('order', {
    title: 'Tạo mới đơn hàng',
    amount: 10000,
    description: desc,
  });
});

router.get('/create_payment_url', function(req, res, next) {
  //var dateFormat = require('dateformat');
  var date = new Date();

  var desc =
    'Thanh toan don hang thoi gian: ' + dateFormat(date, 'yyyy-mm-dd HH:mm:ss');
  res.render('order', {
    title: 'Tạo mới đơn hàng',
    amount: 10000,
    description: desc,
  });
});

router.post('/addnew', async (req, res, next) => {
  // add contract vào db
  const contract = req.body;
  var date = new Date();
  var dateOfHire = dateFormat(date, 'dd/mm/yyyy');
  contract.dayOfHire = dateOfHire;
  contract.startDate = dateFormat(contract.startDate, 'dd/mm/yyyy');
  const isAdded = await contractModel.addContract(contract);
  if (isAdded) {
    res.status(200).json({
      returncode: 1,
      returnmessage:
        'Hire contract was sent to tutor. Please wait for your registration !!!',
    });
  } else {
    res
      .status(201)
      .json({ returncode: 0, returnmessage: 'Something is wrong !!!' });
  }
});

router.post('/create_payment_url', async (req, res, next) => {
  var ipAddr =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  var tmnCode = payment.vnp_TmnCode;
  var secretKey = payment.vnp_HashSecret;
  var vnpUrl = payment.vnp_Url;
  var returnUrl = payment.vnp_ReturnUrl;

  var date = new Date();

  var createDate = dateFormat(date, 'yyyymmddHHmmss');
  var orderId = dateFormat(date, 'yyyymmddHHmmss');
  var amount = req.body.amount;
  var bankCode = req.body.bankCode;
  var orderInfo = req.body.orderDescription;
  var orderType = req.body.orderType;
  var locale = req.body.language;
  if (locale === null || locale === '') {
    locale = 'vn';
  }
  var currCode = 'VND';
  var vnp_Params = {};
  vnp_Params['vnp_Version'] = '2';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  // vnp_Params['vnp_Merchant'] = ''
  vnp_Params['vnp_Locale'] = locale;
  vnp_Params['vnp_CurrCode'] = currCode;
  vnp_Params['vnp_TxnRef'] = orderId;
  vnp_Params['vnp_OrderInfo'] = orderInfo;
  vnp_Params['vnp_OrderType'] = orderType;
  vnp_Params['vnp_Amount'] = amount * 100 * 23000;
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;
  if (bankCode !== null && bankCode !== '') {
    vnp_Params['vnp_BankCode'] = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);

  var signData =
    secretKey + querystring.stringify(vnp_Params, { encode: false });

  var secureHash = sha256(signData);

  vnp_Params['vnp_SecureHashType'] = 'SHA256';
  vnp_Params['vnp_SecureHash'] = secureHash;
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: true });

  console.log('queo', vnpUrl);
  // add oderId vao contract

  const isAdded = await contractModel.addOrderId(req.body._id, orderId);
  if (isAdded) {
    res
      .status(200)
      .json({ returnCode: 1, returnMessage: 'successfully', result: vnpUrl });
  } else {
    res
      .status(201)
      .json({ returnCode: 0, returnMesage: 'something is wrong !!!' });
  }
  //
  //Neu muon dung Redirect thi dong dong ben duoi

  //Neu muon dung Redirect thi mo dong ben duoi va dong dong ben tren
  //res.redirect(vnpUrl);
});

router.get('/vnpay_return', async (req, res, next) => {
  var vnp_Params = req.query;
  var secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);
  var secretKey = payment.vnp_HashSecret;

  var signData =
    secretKey + querystring.stringify(vnp_Params, { encode: false });

  var sha256 = require('sha256');

  var checkSum = sha256(signData);

  if (secureHash === checkSum) {
    var orderId = vnp_Params['vnp_TxnRef'];
    var rspCode = vnp_Params['vnp_ResponseCode'];
    const dayOfPayment = vnp_Params['vnp_PayDate'];
    //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
    const isUpdate = await contractModel.updatePayment(orderId, dayOfPayment);
    if (isUpdate) {
      // res.status(200).json({ returnCode: 1, returnMesage: 'successfully !!!' });
      const contract = await contractModel.getContractByOderId(orderId);
      if (contract) {
        sendmailPaymentToStudent(contract);
        sendmailPaymentToTutor(contract);
      }

      res.redirect(`${url.frontend}contract`);
    } else {
      res
        .status(201)
        .json({ returnCode: 0, returnMesage: 'something is wrong !!!' });
    }
  } else {
    res.status(201).json({ returnCode: 0, returnMesage: 'Fail checksum' });
  }
});

function sortObject(o) {
  var sorted = {},
    key,
    a = [];

  for (key in o) {
    if (o.hasOwnProperty(key)) {
      a.push(key);
    }
  }

  a.sort();

  for (key = 0; key < a.length; key++) {
    sorted[a[key]] = o[a[key]];
  }
  return sorted;
}
router.put('/acceptcontract', (req, res) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        returnCode: 0,
        returnMessage: info ? info.message : err,
      });
    } else if (!user.isTutor) {
      return res
        .status(400)
        .json({ returnCode: 0, returnMesage: 'Wrong role' });
    } else {
      const { id } = req.body;
      const result = await contractModel.updateStatusAccept(id);

      if (result) {
        return res.status(200).json({
          returnCode: 1,
          returnMessage: 'successfully',
        });
      } else {
        return res.status(500).json({
          returnCode: 0,
          returnMessage: 'Error',
        });
      }
    }
  })(req, res);
});

router.put('/cancelcontract', (req, res) => {
  passport.authenticate('jwt', { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        returnCode: 0,
        returnMessage: info ? info.message : err,
      });
    } else {
      const { id } = req.body;
      const result = await contractModel.updateStatusCancel(id);

      if (result) {
        return res.status(200).json({
          returnCode: 1,
          returnMessage: 'successfully',
        });
      } else {
        return res.status(500).json({
          returnCode: 0,
          returnMessage: 'Error',
        });
      }
    }
  })(req, res);
});
module.exports = router;
