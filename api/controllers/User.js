/**
 * Handler after create new user success
 *
 * @param {Object} request
 * @param {Object} reply
 * @param {Object} result
 * @return {Promise}
 */
const onCreatedUserSuccess = function onCreatedUserSuccess(request, reply, result) {
  return request.server.methods.services.mailer.send({
    to: request.payload.email,
    subject: 'test subject',
    html: 'test html email content'
  })
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
  }
};
