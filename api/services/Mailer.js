const Promise = require('bluebird');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const utils = require('../../libs/helpers/utils');

const MAILER_HOST = utils.getEnv('MAILER_HOST');
const MAILER_PORT = utils.getEnv('MAILER_PORT');
const MAILER_AUTH_USER = utils.getEnv('MAILER_AUTH_USER');
const MAILER_AUTH_PASS = utils.getEnv('MAILER_AUTH_PASS');
const MAILER_FROM = utils.getEnv('MAILER_FROM');

const transporter = nodemailer.createTransport(smtpTransport({
  host: MAILER_HOST,
  port: MAILER_PORT,
  auth: {
    user: MAILER_AUTH_USER,
    pass: MAILER_AUTH_PASS
  }
}));

module.exports = {

  /**
   * Send email
   *
   * @param {{from: String, to: String, subject: String}}
   * @return {Promise}
   */
  send({ from = MAILER_FROM, to, subject }) {
    if (!to) {
      return Promise.reject(new Error('To is required'));
    }

    const options = {
      from,
      to,
      subject,
      text: 'test mailer service'
    };

    return new Promise((resolve, reject) => {
      transporter.sendMail(options, (error) => {
        if (error) {
          return reject(error);
        }

        return resolve();
      });
    });
  }
};
