/**
 * Handler after create new user success
 *
 * @param {Object} request
 * @param {Object} reply
 * @param {Object} result
 * @return {Promise}
 */
const onCreatedUserSuccess = function onCreatedUserSuccess(request, reply, result) {
  const emailPayload = {
    to: request.payload.email,
    subject: 'test subject',
    html: 'test html email content'
  };

  return request.server.methods.services.mailer.send(emailPayload)
    .then(() => reply.success({ id: result.getId() }))
    .catch(error => Promise.reject(error));
};

/**
 * Handle login
 *
 * @param {Object} request
 * @param {Object} reply
 * @param {Object} result
 * @return {*}
 */
const handleLogin = function on(request, reply, result) {
  if (!result) {
    return reply.notFound(new Error('Email does not exist'));
  }

  const UserModel = request.getDb().getModel('User');
  const UserAccessTokenModel = request.getDb().getModel('UserAccessToken');

  const hash = result.getPasswordHash();
  const password = request.payload.password;
  const isPasswordCorrect = UserModel.validatePassword(password, hash);

  if (!isPasswordCorrect) {
    return reply.unauthorized(new Error('Please check your email/password again'));
  }

  const userId = result.getId();
  return UserAccessTokenModel.createNewAccessToken(userId)
    .then(tokenResult => reply.success({ access_token: tokenResult.getAccessToken() }))
    .catch(error => reply.serverError(error));
};

module.exports = {

  /**
   * Create new user
   *
   * @param {Object} request
   * @param {Object} reply
   * @return {Promise}
   */
  create(request, reply) {
    const UserModel = request.getDb().getModel('User');

    return UserModel.createNewUser(request.payload)
      .then(result => onCreatedUserSuccess(request, reply, result))
      .catch(error => reply.serverError(error));
  },

  /**
   * User login
   *
   * @param {Object} request
   * @param {Object} reply
   * @return {Promise}
   */
  login(request, reply) {
    const UserModel = request.getDb().getModel('User');
    const email = request.payload.email;

    return UserModel.findByEmail(email)
      .then(result => handleLogin(request, reply, result))
      .catch(error => reply.serverError(error));
  }
};
