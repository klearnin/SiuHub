// test.js, 用于测试邮件能否正确发送（node test.js）
const { sendMail } = require('./util/mailer');

const generateCode = () =>
      Array.from({ length: 6 }, () =>
        Math.random() < 0.5
          ? String.fromCharCode(65 + Math.floor(Math.random() * 26))  // A-Z
          : Math.floor(Math.random() * 10)                            // 0-9
      ).join('');
    
const valiCode = generateCode();


sendMail(
  '2609201821@qq.com',
  '【SiuHub】测试邮件',
  `这是一封测试邮件，来自Siuhub的后端。您的验证码是：${valiCode}（有效期3分钟,可忽略大小写）`
).then(() => {
  console.log("✅ 邮件发送成功");
}).catch(err => {
  console.error("❌ 邮件发送失败：", err);
});
