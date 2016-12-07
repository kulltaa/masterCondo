/**
 * Handler after create new user success
 *
 * @param {Object} request
 * @param {Object} reply
 * @param {Object} result
 * @return {Promise}
 */
const onCreatedUserSuccess = function onCreatedUserSuccess(request, reply, user) {
  const UserEmailVerificationModel = request.getDb().getModel('UserEmailVerification');
  const UserAccessTokenModel = request.getDb().getModel('UserAccessToken');

  const userId = user.getId();
  const email = user.getEmail();

  return UserEmailVerificationModel.createNewToken(email)
    .then((token) => {
      // const baseUrl = utils.getBaseUrl(request);
      const emailPayload = UserEmailVerificationModel.createEmailVerificationPayload(email, token);

      const sendEmail = request.server.methods.services.mailer.send(emailPayload);
      const createNewAccessToken = UserAccessTokenModel.createNewAccessToken(userId);

      return Promise.all([sendEmail, createNewAccessToken]);
    })
    .then((results) => {
      const token = results[1];

      return reply.success({ access_token: token });
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
const handleLogin = function handleLogin(request, reply, user) {
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
    .then(token => reply.success({ access_token: token }))
    .catch(error => reply.serverError(error));
};

/**
 * On validate token result
 *
 * @param {Object} request
 * @param {Object} reply
 * @param {Object} result
 * @return {*}
 */
const onValidateEmailVerification = function onValidateEmailVerification(request, reply, result) {
  const UserModel = request.getDb().getModel('User');
  const { isValid, isExpired } = result;

  if (isValid !== undefined && isValid === false) {
    return reply.unauthorized(new Error('Email/Token invalid'));
  }

  if (isExpired !== undefined && isExpired) {
    return reply.unauthorized(new Error('Token expired'));
  }

  return UserModel.verifyByEmail(request.query.email)
    .then(() => reply.success({ status: 'success' }))
    .catch(error => Promise.reject(error));
};

/**
 * Find email to recover
 *
 * @param {Object} request
 * @param {Object} reply
 * @param {Object} user
 * @return {*}
 */
const onFindForgotEmail = function onFindEmailRecovery(request, reply, user) {
  if (!user) {
    return reply.notFound(new Error('Email has not been registered'));
  }

  const UserRecoveryModel = request.getDb().getModel('UserRecovery');
  const email = user.getEmail();

  return UserRecoveryModel.createNewToken(email)
    .then((token) => {
      const emailPayload = UserRecoveryModel.createEmailRecoveryPayload(email, token);

      return request.server.methods.services.mailer.send(emailPayload);
    })
    .then(() => reply.success({ status: 'success' }))
    .catch(error => Promise.reject(error));
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
   * Verify user
   *
   * @param {Object} request
   * @param {Object} reply
   * @return {Promise}
   */
  verify(request, reply) {
    const UserEmailVerificationModel = request.getDb().getModel('UserEmailVerification');
    const { email, token } = request.query;

    return UserEmailVerificationModel.validate(email, token)
      .then(result => onValidateEmailVerification(request, reply, result))
      .catch(error => reply.serverError(error));
  },

  /**
   * Forgot account
   *
   * @param {Object} request
   * @param {Object} reply
   * @return {Promise}
   */
  forgot(request, reply) {
    const UserModel = request.getDb().getModel('User');
    const email = request.payload.email;

    return UserModel.findByEmail(email)
      .then(user => onFindForgotEmail(request, reply, user))
      .catch(error => reply.serverError(error));
  },

  /**
   * Validate forgot params
   *
   * @param {Object} request
   * @param {Object} reply
   * @return {Promise}
   */
  validateForgotParams(request, reply) {
    const UserRecoveryModel = request.getDb().getModel('UserRecovery');
    const { email, token } = request.query;

    return UserRecoveryModel.validate(email, token)
      .then((result) => {
        const { isValid, isExpired } = result;

        if (isValid !== undefined && isValid === false) {
          return reply.unauthorized(new Error('Email/Token invalid'));
        }

        if (isExpired !== undefined && isExpired) {
          return reply.unauthorized(new Error('Token expired'));
        }

        return reply.success({ status: 'success' });
      })
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
