const db = require("../database/index");
const jwt = require("../util/jwt");
const { jwtSecret } = require("../config/config.default");
const { nanoid } = require("nanoid");
const path = require("path");
const fs = require("fs");

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
      teamId,
    } = req.body;

    if (!name || !phone || !password || !userType) {
      return res.status(400).json({ message: "缺少注册信息" });
    }

    const userId = nanoid();

    const checkPhoneAndType = await db.startQuery(
      `SELECT * FROM users WHERE phone = ${db.escape(phone)} AND type = ${db.escape(userType)}`
    );
    if (checkPhoneAndType.length > 0) {
      return res.status(400).json({ message: "该手机号在该身份下已注册" });
    }

    let avatarPath = null;

    // 先处理头像（所有人都要）
    if (req.files?.avatar?.[0]) {
      const avatarFile = req.files.avatar[0];
      const avatarExt = path.extname(avatarFile.originalname);
      const avatarFilename = `${Date.now()}${avatarExt}`;
      const avatarFullPath = path.resolve(__dirname, "../public/avatars", avatarFilename);
      fs.writeFileSync(avatarFullPath, avatarFile.buffer);
      avatarPath = `/public/avatars/${avatarFilename}`;
    } else if (userType !== "coach") {
      return res.status(400).json({ message: "请上传头像" });
    }

    // 教练注册：创建球队 + 队徽 + 头像
    if (userType === "coach") {
      if (!teamName || !teamAbbr || !req.files?.logo?.[0]) {
        return res.status(400).json({ message: "请上传完整的球队信息和队徽" });
      }

      const checkTeamName = await db.startQuery(
        `SELECT * FROM teams WHERE name = ${db.escape(teamName)}`
      );
      if (checkTeamName.length > 0) {
        return res.status(400).json({ message: "球队名称已存在，请更换" });
      }

      const abbrRegex = /^[A-Z]{2,4}$/;
      if (!abbrRegex.test(teamAbbr)) {
        return res.status(400).json({ message: "球队简称需为2~4位大写英文字母" });
      }

      const checkTeamAbbr = await db.startQuery(
        `SELECT * FROM teams WHERE abbr = ${db.escape(teamAbbr)}`
      );
      if (checkTeamAbbr.length > 0) {
        return res.status(400).json({ message: "球队简称已被占用，请更换" });
      }

      const logoFile = req.files.logo[0];
      const logoExt = path.extname(logoFile.originalname);
      const logoFilename = `${Date.now()}${logoExt}`;
      const logoFullPath = path.resolve(__dirname, "../public/team-logos", logoFilename);
      fs.writeFileSync(logoFullPath, logoFile.buffer);
      const logoPath = `/public/team-logos/${logoFilename}`;

      avatarPath = logoPath; // 教练头像即为队徽

      const newTeamId = nanoid();
      const inviteCode = nanoid(8);
      await db.startQuery(`
        INSERT INTO teams (id, name, abbr, logo_path, invite_code, creator_id)
        VALUES (
          ${db.escape(newTeamId)},
          ${db.escape(teamName)},
          ${db.escape(teamAbbr)},
          ${db.escape(logoPath)},
          ${db.escape(inviteCode)},
          ${db.escape(userId)}
        )
      `);

      await db.startQuery(`
        INSERT INTO users (id, name, phone, email, password, type, team_id, status, avatar)
        VALUES (
          ${db.escape(userId)},
          ${db.escape(name)},
          ${db.escape(phone)},
          ${db.escape(email)},
          MD5(${db.escape(password)}),
          'coach',
          ${db.escape(newTeamId)},
          'approved',
          ${db.escape(avatarPath)}
        )
      `);

      return res.status(200).json({
        message: "注册成功，球队已创建",
        inviteCode,
      });
    }

    // 球迷注册
    if (userType === "fan") {
      if (!teamId || !avatarPath) {
        return res.status(400).json({ message: "请选择主队并上传头像" });
      }

      await db.startQuery(`
        INSERT INTO users (id, name, phone, email, password, type, team_id, status, avatar)
        VALUES (
          ${db.escape(userId)},
          ${db.escape(name)},
          ${db.escape(phone)},
          ${db.escape(email)},
          MD5(${db.escape(password)}),
          'fan',
          ${db.escape(teamId)},
          'approved',
          ${db.escape(avatarPath)}
        )
      `);

      return res.status(200).json({ message: "注册成功" });
    }

    // 球员/经理/队医
    if (["player", "manager", "medic"].includes(userType)) {
      if (!teamId || !avatarPath) {
        return res.status(400).json({ message: "请输入邀请码并上传头像" });
      }

      const teamQuery = await db.startQuery(
        `SELECT id FROM teams WHERE invite_code = ${db.escape(teamId)}`
      );
      if (teamQuery.length === 0) {
        return res.status(400).json({ message: "邀请码无效" });
      }

      const realTeamId = teamQuery[0].id;

      await db.startQuery(`
        INSERT INTO users (id, name, phone, email, password, type, team_id, status, avatar)
        VALUES (
          ${db.escape(userId)},
          ${db.escape(name)},
          ${db.escape(phone)},
          ${db.escape(email)},
          MD5(${db.escape(password)}),
          ${db.escape(userType)},
          ${db.escape(realTeamId)},
          'pending',
          ${db.escape(avatarPath)}
        )
      `);

      return res.status(200).json({ message: "注册成功，等待教练审核" });
    }

    return res.status(400).json({ message: "不支持的用户类型" });
  } catch (err) {
    next(err);
  }
};

// 教练审核加入请求接口
exports.reviewJoinRequest = async (req, res, next) => {
  try {
    const coachId = req.user.id; // 从 token 解出当前登录用户
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
    const coachId = req.user.id;

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

// 获取所有球队列表接口
exports.getAllTeams = async (req, res, next) => {
  try {
    const sql = `
      SELECT id, name, abbr FROM teams;
    `;
    const teams = await db.startQuery(sql);
    res.status(200).json({
      teams
    });
  } catch (err) {
    next(err);
  }
};
