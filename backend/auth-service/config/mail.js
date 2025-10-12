// ...existing code...
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();  
const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user:  process.env.user, 
        pass: process.env.pass
    },
    tls: { rejectUnauthorized: false },
});

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transport.sendMail({
      from: '"Aymen Maiza" <' + (process.env.user ) + ">",
      to,
      subject,
      text,
      html,
    });
    console.log("Message sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;
// ...existing code...