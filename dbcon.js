var mysql = require('mysql');
var pool = mysql.createPool({
  host            : 'u3r5w4ayhxzdrw87.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
  user            : 'h6ukylbvhs5dpn32',
  password        : 'cui53n1o5dr2mm07',
  database        : 'qifmwpdcr0md2lz0'
});

module.exports.pool = pool;
