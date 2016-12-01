module.exports = {
  method: 'notFound',

  /**
   * Method handler for not found response
   *
   * @param {Object} data
   * @return {Object}
   */
  handler(data = {}) {
    this.request.log('trace', 'Sending 404 response', data);

    const res = this.response();
    res.statusCode = 404;

    return res;
  }
};
