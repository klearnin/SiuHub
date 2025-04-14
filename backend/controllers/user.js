const { startQuery,escape } = require("../database");

exports.getAllUsers = async (req, res, next) => {
  try {
    const sql = "SELECT * FROM users";
    const data = await startQuery(sql);
    res.json(data);
  } catch (err) {
    next(err); // 抛给中间件
  }
};

exports.createNotice = async (req, res) => {
  try{
    const { title, content, publish_time ,type } = req.body
    const sql = `
        INSERT INTO notices (title, content, publish_time, type)
        VALUES (${escape(title)}, ${escape(content)}, ${escape(publish_time)}, ${escape(type)})
    `
    const result = await startQuery(sql)
    res.json({ code: 0, msg: '创建成功', data: result })
  }catch (err) {
    next(err); 
  }
}

exports.getNotices = async (req, res) => {
  try{
    const sql = `SELECT * FROM notices ORDER BY publish_time DESC`
    const result = await startQuery(sql)
    
    res.json({ code: 0, msg: '查询成功', data: result })
  }catch (err) {
    next(err); 
  }
}


exports.deleteNotice = async (req, res) => {
  try{
    const { id } = req.params
    const sql = `DELETE FROM notices WHERE id = ${escape(id)}`
    const result = await startQuery(sql)
    res.send({ code: 0, msg: '删除成功', data: result })
  }catch (err) {
    next(err); 
  }
}

