module.exports = {
  method: 'badRequest',

  /**
   * Method handler for bad request response
   *
   * @return {Hapi.Response}
   */
  handler(data = {}) {
    this.request.server.log('info', 'Sending 400 response', data);

    const res = this.response({ error: data });
    res.statusCode = 400;

    return res;
  }
};
