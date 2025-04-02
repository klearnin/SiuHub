const { startQuery } = require("../database");

exports.getAllUsers = async (req, res, next) => {
  try {
    const sql = "SELECT * FROM users";
    const data = await startQuery(sql);
    res.json(data);
  } catch (err) {
    next(err); // 抛给中间件
  }
};
