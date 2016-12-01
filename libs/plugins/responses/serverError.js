module.exports = {
  method: 'serverError',

  /**
   * Method handler for server error response
   *
   * @param {Object} data
   * @return {Object}
   */
  handler(data = {}) {
    this.request.log('error', data);

    let message = 'Internal Server Error';

    if (data.name === 'SequelizeValidationError') {
      message = data.errors[0].message;
    } else if (data.message) {
      message = data.message;
    }

    const res = this.response({ error: { message } });
    res.statusCode = 500;

    return res;
  }
};
