const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sequelize = require("../config/database");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => res.send("SiuHub Backend Running"));

// 连接数据库
sequelize.sync()
    .then(() => console.log("Database connected"))
    .catch(err => console.log("Database error: ", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

