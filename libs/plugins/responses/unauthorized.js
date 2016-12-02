module.exports = {
  method: 'unauthorized',

  /**
   * Method handler for unauthorized response
   *
   * @param {Object} data
   * @return {Object}
   */
  handler(data = {}) {
    this.request.log('error', data);

    let message = 'Unauthorized';

    if (data.isBoom) {
      message = data.output.payload.message;
    } else if (data.message) {
      message = data.message;
    }

    const res = this.response({ error: { message } });
    res.statusCode = 401;

    return res;
  }
};
