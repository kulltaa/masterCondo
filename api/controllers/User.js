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
      .then(result => reply.success({ id: result.getDataValue('id') }))
      .catch(error => reply.serverError(error));
  }
};
