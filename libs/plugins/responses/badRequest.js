module.exports = {
  method: 'badRequest',

  /**
   * Method handler for bad request response
   *
   * @param {object} data
   * @return {Object}
   */
  handler(data = {}) {
    this.request.log('info', data);

    let message = 'Bad Request';

    if (data.isBoom) {
      message = data.output.payload.message;
    } else if (data.message) {
      message = data.message;
    }

    const res = this.response({ error: { message } });
    res.statusCode = 400;

    return res;
  }
};
