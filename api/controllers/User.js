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

  return UserEmailVerificationModel.createNewToken(userId)
    .then((token) => {
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
 * @param {Object} userRecord
 * @return {*}
 */
const handleLogin = function handleLogin(request, reply, userRecord) {
  if (!userRecord) {
    return reply.notFound(new Error('Email does not exist'));
  }

  const UserModel = request.getDb().getModel('User');
  const UserAccessTokenModel = request.getDb().getModel('UserAccessToken');

  const hash = userRecord.getPasswordHash();
  const password = request.payload.password;
  const isPasswordCorrect = UserModel.validatePassword(password, hash);

  if (!isPasswordCorrect) {
    return reply.unauthorized(new Error('Please check your email/password again'));
  }

  const userId = userRecord.getId();
  return UserAccessTokenModel.createNewAccessToken(userId)
    .then(token => reply.success({ access_token: token }))
    .catch(error => reply.serverError(error));
};

/**
 * On found verify token
 *
 * @param {Object} request
 * @param {Object} reply
 * @param {Object} tokenRecord
 * @return {*}
 */
const onFoundVerifyToken = function onFoundVerifyToken(request, reply, tokenRecord) {
  const UserModel = request.getDb().getModel('User');
  const UserEmailVerificationModel = request.getDb().getModel('UserEmailVerification');

  const result = UserEmailVerificationModel.validate(tokenRecord);
  const { isValid, isExpired } = result;

  if (!isValid) {
    return reply.unauthorized(new Error('Token invalid'));
  }

  if (isExpired) {
    return reply.unauthorized(new Error('Token expired'));
  }

  const userId = tokenRecord.getUserId();

  return UserModel.verifyById(userId)
    .then(() => reply.success({ status: 'success' }))
    .catch(error => Promise.reject(error));
};

/**
 * On found forgot email
 *
 * @param {Object} request
 * @param {Object} reply
 * @param {Object} userRecord
 * @return {*}
 */
const onFoundForgotEmail = function onFoundForgotEmail(request, reply, userRecord) {
  if (!userRecord) {
    return reply.notFound(new Error('Email has not been registered'));
  }

  const UserRecoveryModel = request.getDb().getModel('UserRecovery');
  const userId = userRecord.getId();
  const email = userRecord.getEmail();

  return UserRecoveryModel.createNewToken(userId)
    .then((token) => {
      const emailPayload = UserRecoveryModel.createEmailRecoveryPayload(email, token);

      return request.server.methods.services.mailer.send(emailPayload);
    })
    .then(() => reply.success({ status: 'success' }))
    .catch(error => Promise.reject(error));
};

/**
 * On found recover token
 *
 * @param {Object} request
 * @param {Object} reply
 * @param {Object} tokenRecord
 * @return {*}
 */
const onFoundRecoveryToken = function onFoundRecoveryToken(request, reply, tokenRecord) {
  const UserModel = request.getDb().getModel('User');
  const UserAccessTokenModel = request.getDb().getModel('UserAccessToken');
  const UserRecoveryModel = request.getDb().getModel('UserRecovery');

  const result = UserRecoveryModel.validate(tokenRecord);
  const { isValid, isExpired } = result;

  if (!isValid) {
    return reply.unauthorized(new Error('Token invalid'));
  }

  if (isExpired) {
    return reply.unauthorized(new Error('Token expired'));
  }

  const userId = tokenRecord.getUserId();
  const password = request.payload.password;

  const updateUserPassword = UserModel.setPassword(userId, password);
  const invalidateAccessToken = UserAccessTokenModel.invalidateTokenByUserId(userId);
  const invalidateRecoveryToken = UserRecoveryModel.invalidateTokenByUserId(userId);

  return Promise.all([updateUserPassword, invalidateAccessToken, invalidateRecoveryToken])
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
      .then(userRecord => handleLogin(request, reply, userRecord))
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
    const token = request.query.token;

    return UserEmailVerificationModel.findByToken(token)
      .then(tokenRecord => onFoundVerifyToken(request, reply, tokenRecord))
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
      .then(userRecord => onFoundForgotEmail(request, reply, userRecord))
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
    const token = request.query.token;

    return UserRecoveryModel.findAndValidateToken(token)
      .then((result) => {
        const { isValid, isExpired } = result;

        if (!isValid) {
          return reply.unauthorized(new Error('Token invalid'));
        }

        if (isExpired) {
          return reply.unauthorized(new Error('Token expired'));
        }

        return reply.success({ status: 'success' });
      })
      .catch(error => reply.serverError(error));
  },

  /**
   * Recover password
   *
   * @param {Object} request
   * @param {Object} reply
   * @return {*}
   */
  recover(request, reply) {
    const UserRecoveryModel = request.getDb().getModel('UserRecovery');
    const token = request.payload.token;

    return UserRecoveryModel.findByToken(token)
      .then(tokenRecord => onFoundRecoveryToken(request, reply, tokenRecord))
      .catch(error => Promise.reject(error));
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
