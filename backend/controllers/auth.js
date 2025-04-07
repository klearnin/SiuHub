const db = require("../database/index");
const jwt = require("../util/jwt");
const { jwtSecret } = require("../config/config.default");
const { nanoid } = require("nanoid");
const path = require("path");

exports.login = async (req, res, next) => {
  try {
    const { phone, password, type } = req.body;

    if (!phone || !password || !type) {
      return res.status(400).json({ message: "缺少登录信息" });
    }

    // 查询用户
    const sql = `
      SELECT * FROM users 
      WHERE phone = ${db.escape(phone)} 
        AND password = MD5(${db.escape(password)}) 
        AND type = ${db.escape(type)}
      LIMIT 1
    `;
    const result = await db.startQuery(sql);

    if (!result[0]) {
      return res.status(401).json({ message: "手机号、密码或身份不正确" });
    }

    const user = result[0];

    // 判断审核状态（仅球员/经理/队医需要）
    const needApproval = ['player', 'manager', 'medic'];
    if (needApproval.includes(type) && user.status !== 'approved') {
      return res.status(403).json({ message: "账号未审核通过，暂无法登录" });
    }

    // 生成 token
    const token = await jwt.sign(
      { userId: user.id, type: user.type },
      jwtSecret,
      { expiresIn: 60 * 60 * 24 } // 1天
    );

    // 返回信息（去除密码）
    delete user.password;

    res.status(200).json({
      token,
      user
    });

  } catch (err) {
    next(err);
  }
};


exports.register = async (req, res, next) => {
  try {
    const userType = req.params.type; // 'coach'、'fan'、'player' 等

    const {
      name,
      phone,
      email,
      password,
      teamName,
      teamAbbr,
      teamId,       // 球迷选择的主队 或 球员输入的邀请码
    } = req.body;

    if (!name || !phone || !password || !userType) {
      return res.status(400).json({ message: "缺少注册信息" });
    }

    // 生成用户 ID
    const userId = nanoid();

    // 检查手机号是否重复
    const checkPhone = await db.startQuery(
      `SELECT * FROM users WHERE phone = ${db.escape(phone)}`
    );
    if (checkPhone.length > 0) {
      return res.status(400).json({ message: "该手机号已注册" });
    }

    // 教练注册时：创建球队 + 生成邀请码
    if (userType === "coach") {
      if (!teamName || !teamAbbr || !req.file) {
        return res.status(400).json({ message: "请上传完整的球队信息和队徽" });
      }

      // 队徽路径（存储到 public/team-logos 目录）
      const logoPath = `/public/team-logos/${req.file.filename}`;
      const inviteCode = nanoid(8);

      // 插入球队
      const teamId = nanoid();
      const insertTeamSQL = `
        INSERT INTO teams (id, name, abbr, logo_path, invite_code, creator_id)
        VALUES (
          ${db.escape(teamId)},
          ${db.escape(teamName)},
          ${db.escape(teamAbbr)},
          ${db.escape(logoPath)},
          ${db.escape(inviteCode)},
          ${db.escape(userId)}
        )
      `;
      await db.startQuery(insertTeamSQL);

      // 插入用户信息
      const insertUserSQL = `
        INSERT INTO users (id, name, phone, email, password, type, team_id, status)
        VALUES (
          ${db.escape(userId)},
          ${db.escape(name)},
          ${db.escape(phone)},
          ${db.escape(email)},
          MD5(${db.escape(password)}),
          'coach',
          ${db.escape(teamId)},
          'approved'
        )
      `;
      await db.startQuery(insertUserSQL);

      return res.status(200).json({
        message: "注册成功，球队已创建",
        inviteCode: inviteCode
      });
    }

    // 球迷注册：选择主队，无需审核
    if (userType === "fan") {
      if (!teamId) {
        return res.status(400).json({ message: "请选择支持的主队" });
      }
      const sql = `
        INSERT INTO users (id, name, phone, email, password, type, team_id, status)
        VALUES (
          ${db.escape(userId)},
          ${db.escape(name)},
          ${db.escape(phone)},
          ${db.escape(email)},
          MD5(${db.escape(password)}),
          'fan',
          ${db.escape(teamId)},
          'approved'
        )
      `;
      await db.startQuery(sql);
      return res.status(200).json({ message: "注册成功" });
    }

    // 球员、经理、队医：需填写邀请码，审核后激活
    if (["player", "manager", "medic"].includes(userType)) {
      if (!teamId) {
        return res.status(400).json({ message: "请输入球队邀请码" });
      }

      // 查询邀请码对应的 teamId
      const teamQuery = await db.startQuery(
        `SELECT id FROM teams WHERE invite_code = ${db.escape(teamId)}`
      );
      if (teamQuery.length === 0) {
        return res.status(400).json({ message: "邀请码无效" });
      }

      const realTeamId = teamQuery[0].id;

      const sql = `
        INSERT INTO users (id, name, phone, email, password, type, team_id, status)
        VALUES (
          ${db.escape(userId)},
          ${db.escape(name)},
          ${db.escape(phone)},
          ${db.escape(email)},
          MD5(${db.escape(password)}),
          ${db.escape(userType)},
          ${db.escape(realTeamId)},
          'pending'
        )
      `;
      await db.startQuery(sql);
      return res.status(200).json({ message: "注册成功，等待教练审核" });
    }

    return res.status(400).json({ message: "不支持的用户类型" });
  } catch (err) {
    next(err);
  }
};

// 邀请码验证接口
exports.checkInvite = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ message: "邀请码不能为空" });
    }

    const sql = `
      SELECT id, name, abbr, logo_path 
      FROM teams 
      WHERE invite_code = ${db.escape(inviteCode)}
      LIMIT 1
    `;

    const result = await db.startQuery(sql);

    if (result.length === 0) {
      return res.status(404).json({ message: "邀请码无效或不存在" });
    }

    const team = result[0];
    res.status(200).json({
      message: "邀请码有效",
      team
    });

  } catch (err) {
    next(err);
  }
};

// 教练审核加入请求接口
exports.reviewJoinRequest = async (req, res, next) => {
  try {
    const coachId = req.user.userId; // 从 token 解出当前登录用户
    const { userId, approve } = req.body;

    if (!userId || typeof approve === 'undefined') {
      return res.status(400).json({ message: "缺少参数" });
    }

    // 查询教练信息
    const coachSql = `
      SELECT * FROM users 
      WHERE id = ${db.escape(coachId)} 
        AND type = 'coach'
      LIMIT 1
    `;
    const coachRes = await db.startQuery(coachSql);
    if (coachRes.length === 0) {
      return res.status(403).json({ message: "仅教练可审核" });
    }

    const teamId = coachRes[0].team_id;

    // 查询目标用户是否属于本球队且未审核
    const userSql = `
      SELECT * FROM users 
      WHERE id = ${db.escape(userId)} 
        AND team_id = ${db.escape(teamId)} 
        AND status = 'pending'
        AND type IN ('player', 'manager', 'medic')
      LIMIT 1
    `;
    const userRes = await db.startQuery(userSql);
    if (userRes.length === 0) {
      return res.status(404).json({ message: "该用户不存在或不可审核" });
    }

    if (approve) {
      const updateSql = `
        UPDATE users 
        SET status = 'approved' 
        WHERE id = ${db.escape(userId)}
      `;
      await db.startQuery(updateSql);
      return res.status(200).json({ message: "已通过审核" });
    } else {
      const deleteSql = `
        DELETE FROM users 
        WHERE id = ${db.escape(userId)}
      `;
      await db.startQuery(deleteSql);
      return res.status(200).json({ message: "已拒绝并删除该用户" });
    }
  } catch (err) {
    next(err);
  }
};

// 获取待审核用户列表接口
exports.getPendingUsers = async (req, res, next) => {
  try {
    const coachId = req.user.userId;

    // 查询教练信息确认身份
    const coachSql = `
      SELECT * FROM users 
      WHERE id = ${db.escape(coachId)} 
        AND type = 'coach'
      LIMIT 1
    `;
    const coachRes = await db.startQuery(coachSql);
    if (coachRes.length === 0) {
      return res.status(403).json({ message: "仅教练可查看待审核用户" });
    }

    const teamId = coachRes[0].team_id;

    // 查询本球队中所有待审核成员
    const pendingSql = `
      SELECT id, name, phone, email, type, created_at 
      FROM users 
      WHERE team_id = ${db.escape(teamId)} 
        AND status = 'pending' 
        AND type IN ('player', 'manager', 'medic')
      ORDER BY created_at ASC
    `;
    const pendingUsers = await db.startQuery(pendingSql);

    res.status(200).json({
      message: "获取成功",
      users: pendingUsers
    });
  } catch (err) {
    next(err);
  }
};
