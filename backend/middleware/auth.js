const { verify } = require('../util/jwt');
const { jwtSecret } = require('../config/config.default');
const db = require('../database/index');

module.exports = async (req, res, next) => {
  try {
    let token = req.headers['authorization'];
    token = token ? token.split('Bearer ')[1] : null;
    if (!token) return res.status(401).end();

    const decoded = await verify(token, jwtSecret);
    
    const sql = `SELECT * FROM users WHERE id = ${db.escape(decoded.userId)} LIMIT 1`;

    const userRes = await db.startQuery(sql);

    if (!userRes[0]) return res.status(401).end("无效用户");

    delete userRes[0].password;
    req.user = userRes[0];
    next();
  } catch (err) {
    return res.status(401).end("未登录");
  }
};
