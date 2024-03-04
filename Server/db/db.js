const Mysql = require("mysql2");
const connection = Mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "code",
  database: "messages",
});

module.exports = connection;
