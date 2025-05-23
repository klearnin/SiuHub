const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const financeController = require("../controllers/finance");

// 添加资金记录
router.post("/add", auth, financeController.addFinanceRecord);

// 修改资金记录
router.put("/:id", auth, financeController.updateFinanceRecord);

// 删除资金记录
router.delete("/:id", auth, financeController.deleteFinanceRecord);

// 获取当前剩余资金
router.get("/balance", auth, financeController.getCurrentBalance);

// 获取资金变化趋势（用于折线图）
router.get("/trend", auth, financeController.getFinanceTrend);

// 获取所有记录列表（用于表格展示）
router.get("/all", auth, financeController.getAllFinanceRecords);

// 获取单条记录详情
router.get("/:id", auth, financeController.getFinanceRecordById);

module.exports = router;
