const Promise = require('bluebird');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

const transporter = nodemailer.createTransport(smtpTransport({
  host: '',
  port: ''
}));

/**
 * Send email
 *
 * @return {Promise}
 */
const send = function send() {
  return new Promise((resolve, reject) => {
    transporter.sendMail((error) => {
      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
};

module.exports = {
  send
};
