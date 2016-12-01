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
    .then(() => reply.success({ id: result.getDataValue('id') }))
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
    const { email, password } = request.payload;

    return UserModel.findPasswordHashByEmail(email)
      .then((hash) => {
        if (!hash) {
          return reply.notFound(new Error('Email does not exist'));
        }

        const isPasswordCorrect = UserModel.isPasswordCorrect(password, hash);

        if (!isPasswordCorrect) {
          return reply.serverError(new Error('Please check your email/password again'));
        }

        return Promise.resolve();
      })
      .catch(error => reply.serverError(error));
  }
};
