const MongoClient = require('mongodb').MongoClient;
// connection string
 const PROD_URI = "mongodb+srv://huycong2798:a123456789@caro-server-jlfq4.mongodb.net/caro-server?retryWrites=true&w=majority";

var db = {
  records: {}
};

function connect(uri) {
  return MongoClient.connect(uri, {
    useNewUrlParser: true
  }).then(client => client.db())
}

exports.initdb = async function () {
  let database = await connect(PROD_URI);
  db.records = database;
}

exports.db = db;