module.exports = {
  method: 'badRequest',

  /**
   * Method handler for bad request response
   *
   * @param {object} data
   * @return {Object}
   */
  handler(data = {}) {
    this.request.log('info', 'Sending 400 response', data);

    let message = 'Bad Request';

    if (data.isBoom) {
      message = data.output.payload.message;
    }

    const res = this.response({ error: { message } });
    res.statusCode = 400;

    return res;
  }
};
