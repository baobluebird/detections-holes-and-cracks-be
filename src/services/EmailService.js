const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config()
const sendEmail = async (email,code) => {
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_ACCOUNT, // generated ethereal user
        pass: process.env.MAIL_PASSWORD, 
    },
});

const mailOptions = {
    from: process.env.MAIL_ACCOUNT,
    to: email,
    subject: 'Reset Password',
    text: `Your verification code is: ${code}`,
  };

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    verificationCodes[email] = {
      code: verificationCode,
      expires: Date.now() + 60 * 1000, 
    };
  });
}

module.exports = {
  sendEmail
}