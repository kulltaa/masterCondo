module.exports = {

  /**
   * Get environment variable by key
   *
   * @param {String} key
   * @param {String} defaultValue
   * @return {String}
   */
  getEnv(key, defaultValue = '') {
    if (!key) {
      throw new Error('Key is required');
    }

    return process.env[key] || defaultValue;
  },

  /**
   * Get current NODE_ENV value
   *
   * @return {String}
   */
  env() {
    return this.getEnv('NODE_ENV');
  },

  /**
   * Get app base url
   *
   * @return {String}
   */
  getBaseUrl(request) {
    const baseUrl = this.getEnv('BASE_URL');
    if (baseUrl) {
      return baseUrl;
    }

    if (!request) {
      return '';
    }

    const proto = request.headers['x-forwarded-proto'] || request.connection.info.protocol;
    const host = request.info.host;

    return `${proto}://${host}`;
  }
};
