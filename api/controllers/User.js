module.exports = {

  /**
   * Create new user
   *
   * @param {Hapi.Request} request
   * @param {Hapi.Reply} reply
   * @return {Promise}
   */
  create(request, reply) {
    const User = request.getDb().getModel('User');

    const testAccount = {
      email: 'test@mail.com',
      username: 'bao',
      password: '123'
    };

    return User.create(testAccount)
      .then(() => reply.success())
      .catch(error => reply.serverError(error));
  },

  login(request, reply) {
    const User = request.getDb().getModel('User');
    const UserAccessToken = request.getDb().getModel('UserAccessToken');

    const { username, password } = request.payload;
    const cond = {
      where: {
        username,
        password
      }
    };

    return User.findOne(cond)
      .then((user) => {
        if (!user) {
          return reply.notFound();
        }

        const token = UserAccessToken.genToken();

        return UserAccessToken.create({
          access_token: token.value,
          access_token_expired_at: token.expired,
          user_id: user.id
        });
      })
      .then(() => reply.success())
      .catch(error => reply.serverError(error));
  },

  all(request, reply) {
    const User = request.getDb().getModel('User');

    return User.findAll()
      .then(users => reply.success(users))
      .catch(error => reply.serverError(error));
  }
};
