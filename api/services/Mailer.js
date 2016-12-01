const Promise = require('bluebird');
const nodemailer = require('nodemailer');
const sesTransport = require('nodemailer-ses-transport');
const utils = require('../../libs/helpers/utils');

const MAILER_AWS_SES_ACCESS_KEY = utils.getEnv('MAILER_AWS_SES_ACCESS_KEY');
const MAILER_AWS_SES_SECRET_KEY = utils.getEnv('MAILER_AWS_SES_SECRET_KEY');
const MAILER_AWS_SES_REGION = utils.getEnv('MAILER_AWS_SES_REGION');
const MAILER_FROM = utils.getEnv('MAILER_FROM');

const transporter = nodemailer.createTransport(sesTransport({
  accessKeyId: MAILER_AWS_SES_ACCESS_KEY,
  secretAccessKey: MAILER_AWS_SES_SECRET_KEY,
  region: MAILER_AWS_SES_REGION
}));

module.exports = {

  /**
   * Send html email
   *
   * @param {{from: String, to: String, subject: String, html: String}}
   * @return {Promise}
   */
  send({ from = MAILER_FROM, to, subject, html }) {
    if (!to) {
      return Promise.reject(new Error('To is required'));
    }

    const options = {
      from,
      to,
      subject,
      html
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
