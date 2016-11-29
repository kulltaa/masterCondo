module.exports = {
  method: 'success',

  /**
   * Method handler for success response
   *
   * @param {Object} data
   * @return Hapi.Response
   */
  handler(data = {}) {
    this.request.server.log('trace', 'Sending 200 response', data);

    const res = this.response(data);
    res.statusCode = 200;

    return res;
  }
};
