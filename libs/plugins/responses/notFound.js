module.exports = {
  method: 'notFound',

  /**
   * Method handler for not found response
   *
   * @param {Object} data
   * @return {Object}
   */
  handler(data = {}) {
    this.request.log('info', data);

    let message = 'Not Found';

    if (data.isBoom) {
      message = data.output.payload.message;
    } else if (data.message) {
      message = data.message;
    }

    const res = this.response({ error: { message } });
    res.statusCode = 404;

    return res;
  }
};
