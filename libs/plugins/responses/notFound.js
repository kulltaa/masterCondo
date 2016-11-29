module.exports = {
  method: 'notFound',

  /**
   * Method handler for not found response
   *
   * @return {Hapi.Response}
   */
  handler(data = {}) {
    this.request.server.log('trace', 'Sending 404 response', data);

    const res = this.response();
    res.statusCode = 404;

    return res;
  }
};
