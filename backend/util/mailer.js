// utils/mailer.js
const nodemailer = require('nodemailer');

let authUser = '2609201821@qq.com';
let authPass = 'qutebmxlcskceafi'; // ✅ 使用 QQ 邮箱授权码

let transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    secureConnection: true,
    port: 465,
    secure: true,
    auth: {
        user: authUser,
        pass: authPass
    }
});

async function sendMail(address, title, content) {
    const mailOption = {
        from: authUser,
        to: `${address}`,
        subject: `${title}`,
        text: `${content}`
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOption, (err, info) => {
            if (err) {
                console.error('邮件发送失败:', err);
                return reject(err);
            } else {
                console.log('✅ 邮件发送成功:', info.response);
                return resolve(info.response);
            }
        });
    });
}

module.exports = { sendMail };
