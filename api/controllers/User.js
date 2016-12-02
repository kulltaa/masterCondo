/**
 * Handler after create new user success
 *
 * @param {Object} request
 * @param {Object} reply
 * @param {Object} result
 * @return {Promise}
 */
const onCreatedUserSuccess = function onCreatedUserSuccess(request, reply, user) {
  const UserAccessTokenModel = request.getDb().getModel('UserAccessToken');

  const userId = user.getId();
  const emailPayload = {
    to: request.payload.email,
    subject: 'test subject',
    html: 'test html email content'
  };

  const sendEmail = request.server.methods.services.mailer.send(emailPayload);
  const createNewAccessToken = UserAccessTokenModel.createNewAccessToken(userId);

  return Promise.all([sendEmail, createNewAccessToken])
    .then((results) => {
      const token = results[1];

      return reply.success({ access_token: token.getValue() });
    })
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
const handleLogin = function on(request, reply, user) {
  if (!user) {
    return reply.notFound(new Error('Email does not exist'));
  }

  const UserModel = request.getDb().getModel('User');
  const UserAccessTokenModel = request.getDb().getModel('UserAccessToken');

  const hash = user.getPasswordHash();
  const password = request.payload.password;
  const isPasswordCorrect = UserModel.validatePassword(password, hash);

  if (!isPasswordCorrect) {
    return reply.unauthorized(new Error('Please check your email/password again'));
  }

  const userId = user.getId();
  return UserAccessTokenModel.createNewAccessToken(userId)
    .then(token => reply.success({ access_token: token.getValue() }))
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
      .then(user => onCreatedUserSuccess(request, reply, user))
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
      .then(user => handleLogin(request, reply, user))
      .catch(error => reply.serverError(error));
  },

  /**
   * Get user status
   *
   * @param {Object} request
   * @param {Object} reply
   * @return {*}
   */
  status(request, reply) {
    const user = request.auth.credentials.user;

    return reply({ is_active: user.getStatus() });
  }
};
