const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config()


const sendEmailForgotPass = async (email, code) => {
  try {
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.MAIL_ACCOUNT,
              pass: process.env.MAIL_PASSWORD,
          },
      });

      const mailOptions = {
          from: process.env.MAIL_ACCOUNT,
          to: email,
          subject: 'Reset Password',
          text: `Your verification code is: ${code}`,
      };

      const response = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + response.response);
  } catch (error) {
      console.error(`Error sending email: ${error.message || error}`);
      throw new Error('Failed to send verification email');
  }
};

module.exports = {
  sendEmailForgotPass
}