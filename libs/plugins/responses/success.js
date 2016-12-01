module.exports = {
  method: 'success',

  /**
   * Method handler for success response
   *
   * @param {Object} data
   * @return {Object}
   */
  handler(data = {}) {
    this.request.log('trace', data);

    const res = this.response(data);
    res.statusCode = 200;

    return res;
  }
};
