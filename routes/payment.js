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
const contractModel = require('../model/contracts')
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
  var orderId = createDate;
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
   
  // add contract vào db
  const contract = req.body;
  contract.idContract = orderId;
  contract.dayOfPayment = createDate;
 
  const isAdded = await contractModel.addContract(contract);
  if(isAdded)
  {
    res.status(200).json({ returncode:1,returnmessage:"successfully", result: vnpUrl });
  }
  else
  {
      res.status(201).json({ returncode:0,returnmessage:"error"});
  }
  //
  //Neu muon dung Redirect thi dong dong ben duoi
  
  //Neu muon dung Redirect thi mo dong ben duoi va dong dong ben tren
  // res.redirect(vnpUrl);
});

router.get('/vnpay_return', function(req, res, next) {
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
    //Kiem tra du lieu co hop le khong, cap nhat trang thai don hang va gui ket qua cho VNPAY theo dinh dang duoi
    res.status(200).json({ RspCode: '00', Message: 'success' });
  } else {
    res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
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

module.exports = router;
