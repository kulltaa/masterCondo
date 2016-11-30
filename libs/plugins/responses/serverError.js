const utils = require('../../helpers/utils');

module.exports = {
  method: 'serverError',

  /**
   * Method handler for server error response
   *
   * @param {Object} data
   * @return {Hapi.Response}
   */
  handler(data = {}) {
    this.request.server.log('error', 'Sending 500 response', data);

    let res;

    if (utils.env() === 'production') {
      res = this.response({});
    } else {
      res = this.response({ error: data });
    }

    res.statusCode = 500;

    return res;
  }
};
