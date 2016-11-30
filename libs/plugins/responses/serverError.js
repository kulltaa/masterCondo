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

    let message = 'Internal Server Error';

    if (data.name === 'SequelizeValidationError') {
      message = data.errors[0].message;
    }

    const res = this.response({ error: { message } });
    res.statusCode = 500;

    return res;
  }
};
