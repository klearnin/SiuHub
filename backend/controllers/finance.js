const db = require("../database");

// 添加资金变更记录
exports.addFinanceRecord = async (req, res, next) => {
  try {
    const { team_id } = req.user;
    const { amount, reason } = req.body;

    if (!amount || !reason) {
      return res.status(400).json({ msg: "缺少必要信息" });
    }

    await db.startQuery(
      `INSERT INTO finance_records (team_id, amount, reason) VALUES (?, ?, ?)`,
      [team_id, amount, reason]
    );

    res.json({ code: 0, msg: "资金记录添加成功" });
  } catch (err) {
    next(err);
  }
};

// 修改资金变更记录
exports.updateFinanceRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const { team_id } = req.user;

    await db.startQuery(
      `UPDATE finance_records SET amount = ?, reason = ? 
       WHERE id = ? AND team_id = ?`,
      [amount, reason, id, team_id]
    );

    res.json({ code: 0, msg: "资金记录更新成功" });
  } catch (err) {
    next(err);
  }
};

// 删除资金记录
exports.deleteFinanceRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { team_id } = req.user;

    await db.startQuery(
      `DELETE FROM finance_records WHERE id = ? AND team_id = ?`,
      [id, team_id]
    );

    res.json({ code: 0, msg: "资金记录删除成功" });
  } catch (err) {
    next(err);
  }
};

// 获取当前剩余资金
exports.getCurrentBalance = async (req, res, next) => {
  try {
    const { team_id } = req.user;

    const [result] = await db.startQuery(
      `SELECT COALESCE(SUM(amount), 0) AS balance FROM finance_records WHERE team_id = ?`,
      [team_id]
    );

    res.json({ code: 0, data: result.balance });
  } catch (err) {
    next(err);
  }
};

// 获取所有记录及对应余额（用于折线图）
exports.getFinanceTrend = async (req, res, next) => {
  try {
    const { team_id } = req.user;

    const records = await db.startQuery(
      `SELECT id, amount, reason, created_at 
       FROM finance_records 
       WHERE team_id = ? 
       ORDER BY created_at ASC`,
      [team_id]
    );

    let total = 0;
    const trend = records.map(r => {
      total += parseFloat(r.amount);
      return {
        id: r.id,
        created_at: r.created_at,
        amount: parseFloat(r.amount),
        reason: r.reason,
        balance: total.toFixed(2)
      };
    });

    res.json({ code: 0, data: trend });
  } catch (err) {
    next(err);
  }
};

// 获取所有记录列表
exports.getAllFinanceRecords = async (req, res, next) => {
    try {
      const { team_id } = req.user;
      const records = await db.startQuery(
        `SELECT id, amount, reason, created_at 
         FROM finance_records 
         WHERE team_id = ? 
         ORDER BY created_at DESC`,
        [team_id]
      );
      res.json({ code: 0, data: records });
    } catch (err) {
      next(err);
    }
};

// 获取单条记录详情
exports.getFinanceRecordById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { team_id } = req.user;
  
      const [record] = await db.startQuery(
        `SELECT id, amount, reason, created_at 
         FROM finance_records 
         WHERE id = ? AND team_id = ?`,
        [id, team_id]
      );
  
      if (!record) {
        return res.status(404).json({ msg: "记录未找到" });
      }
  
      res.json({ code: 0, data: record });
    } catch (err) {
      next(err);
    }
};
  