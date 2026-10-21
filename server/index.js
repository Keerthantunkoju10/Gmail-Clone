const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Gmail Clone Backend Server running on port ${PORT}`);
  console.log(` IMAP host: imap.gmail.com:993 (SSL/TLS)`);
  console.log(` SMTP host: smtp.gmail.com:465 (SSL/TLS)`);
  console.log(`===============================================`);
});
