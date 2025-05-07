const mysql = require('mysql')
const {
    nextTick
} = require('process')
const {
    dbUri
} = require('../config/config.default')

// 创建mysql数据库连接池(由于mysql是面向连接的数据库，因此连接资源很宝贵)
try{
    var pool = mysql.createPool({
        connectionLimit: 50,
        host: '127.0.0.1',
        user: 'root',       
        password: '123456',   
        database: 'siuhub',
        charset: 'utf8mb4'
    })
} catch (err) {
    console.log(err,'err');
}

// 创建数据库查询API
// 使用async 函数，让查询变为异步处理，主线程不需要等待数据库IO操作
// 修改后的 startQuery：支持参数绑定
async function startQuery(sql, params = []) {
    try {
        const promise = new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    console.error("连接数据库失败:", err.message);
                    return reject(err);
                }

                connection.query(sql, params, (err, result) => {
                    if (err) {
                        console.error("ERROR---" + err.sqlMessage);
                        return reject(err);
                    }

                    resolve(result);
                    connection.release();
                });
            });
        });

        return promise;
    } catch (err) {
        console.error("执行 startQuery 出错：", err.message);
        throw err;
    }
}

// 防止sql注入
function escape(e) {
    return pool.escape(e)
}

exports.startQuery = startQuery

exports.escape = escape

exports.pool = pool