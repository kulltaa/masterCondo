/* eslint-disable */
require('dotenv').config();

// disable logging
process.env.LOG_STDOUT = '';
process.env.LOG_FILE = '';

const Hapi = require('hapi');
const Promise = require('bluebird');
const sinon = require('sinon');
const chai = require('chai');
const faker = require('faker');
const plugins = require('../../../../libs/plugins');
require('sinon-as-promised')(Promise);

const expect = chai.expect;

describe('Forgot', () => {
  let server;
  let stubSendEmail;

  beforeEach((done) => {
    server = new Hapi.Server();
    server.connection();

    server.register(plugins, () => {
      stubSendEmail = sinon.stub(server.methods.services.mailer, 'send');
      stubSendEmail.resolves();

      done();
    });
  });

  afterEach((done) => {
    stubSendEmail.restore();

    server.stop(done);
  });

  it('should return error with status code 400 when request doesn\'t contain email', (done) => {
    const options = {
      method: 'POST',
      url: '/users/forgot',
      payload: {}
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"email" is required');

      done();
    })
  });

  it('should return error with status code 400 when email empty', (done) => {
    const options = {
      method: 'POST',
      url: '/users/forgot',
      payload: {
        email: ''
      }
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"email" is not allowed to be empty');

      done();
    })
  });

  it('should return error with status code 400 when email format invalid', (done) => {
    const options = {
      method: 'POST',
      url: '/users/forgot',
      payload: {
        email: 'invalid-email'
      }
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"email" must be a valid email');

      done();
    });
  });

  it('shoud return error with status 404 when email has not been registered', (done) => {
    const options = {
      method: 'POST',
      url: '/users/forgot',
      payload: {
        email: faker.internet.email()
      }
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(404);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('Email has not been registered');

      done();
    });
  });

  it('shoud return success when email has been registered', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: 'random-password',
      password_confirmation: 'random-password'
    };

    const createNewUserOptions = {
      method: 'POST',
      url: '/users/register',
      payload
    };

    const forgotOptions = {
      method: 'POST',
      url: '/users/forgot',
      payload: {
        email: payload.email
      }
    };

    server.inject(createNewUserOptions, (res) => {
      const request = res.request;
      const UserModel = request.getDb().getModel('User');
      const UserRecoveryModel = request.getDb().getModel('UserRecovery');

      const spyCreateRecoveryToken = sinon.spy(UserRecoveryModel, 'createNewToken');
      const spyCreateEmailRecoveryPayload = sinon.spy(UserRecoveryModel, 'createEmailRecoveryPayload');

      server.inject(forgotOptions, (res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.result).to.include.keys('status');
        expect(res.result.status).to.equal('success');

        UserModel.findByEmail(payload.email)
          .then((user) => {
            const userId = user.getId();

            sinon.assert.calledWith(spyCreateRecoveryToken, userId);

            return UserRecoveryModel.findByUserId(userId);
          })
          .then((result) => {
            expect(result).to.not.null;
            expect(result.getStatus()).to.equal(true);

            sinon.assert.calledWith(
              spyCreateEmailRecoveryPayload,
              payload.email,
              result.getToken()
            );

            const emailRecoveryPayload = spyCreateEmailRecoveryPayload.returnValues[0];
            sinon.assert.calledWith(stubSendEmail, emailRecoveryPayload);

            done();
          })
          .catch(error => done(error));
      });
    });
  });
});

describe('Validate Forgot Params', () => {
  let server;
  let stubSendEmail;

  beforeEach((done) => {
    server = new Hapi.Server();
    server.connection();

    server.register(plugins, () => {
      stubSendEmail = sinon.stub(server.methods.services.mailer, 'send');
      stubSendEmail.resolves();

      done();
    });
  });

  afterEach((done) => {
    stubSendEmail.restore();

    server.stop(done);
  });

  it('should return error with status 400 when verify link doesn\'t contain token', (done) => {
    const email = 'mailer@example.com';
    const options = {
      method: 'GET',
      url: `/users/validate_forgot_params`
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"token" is required');

      done();
    });
  });

  it('should return error with status 401 when token invalid', (done) => {
    const invalidToken = 'invalid-token';

    const verificationUrl = `/users/validate_forgot_params?token=${invalidToken}`;

    server.inject(verificationUrl, (res) => {
      expect(res.statusCode).to.equal(401);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('Token invalid');

      done();
    });
  });

  it('should return error with status 401 when token inactive', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: 'random-password',
      password_confirmation: 'random-password'
    };

    const createNewUserOptions = {
      method: 'POST',
      url: '/users/register',
      payload
    };

    server.inject(createNewUserOptions, (res) => {
      const request = res.request;
      const UserModel = request.getDb().getModel('User');
      const UserRecoveryModel = request.getDb().getModel('UserRecovery');

      const forgotOptions = {
        method: 'POST',
        url: '/users/forgot',
        payload: {
          email: payload.email
        }
      };

      server.inject(forgotOptions, (res) => {
        UserModel.findByEmail(payload.email)
          .then((user) => {
            const userId = user.getId();

            return UserRecoveryModel.findByUserId(userId);
          })
          .then((result) => {
            const userId = result.getUserId();
            const token = result.getToken();

            return UserRecoveryModel.invalidateToken(token)
              .then((result) => {
                const validateForgotParamsUrl = `/users/validate_forgot_params?token=${token}`;

                server.inject(validateForgotParamsUrl, (res) => {
                  expect(res.statusCode).to.equal(401);
                  expect(res.result).to.include.keys('error');
                  expect(res.result.error.message).to.equal('Token invalid');

                  done();
                });
              });
          });
      });
    });
  });

  it('should return success when token valid', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: 'random-password',
      password_confirmation: 'random-password'
    };

    const createNewUserOptions = {
      method: 'POST',
      url: '/users/register',
      payload
    };

    server.inject(createNewUserOptions, (res) => {
      const request = res.request;
      const UserModel = request.getDb().getModel('User');
      const UserRecoveryModel = request.getDb().getModel('UserRecovery');

      const forgotOptions = {
        method: 'POST',
        url: '/users/forgot',
        payload: {
          email: payload.email
        }
      };

      server.inject(forgotOptions, (res) => {
        UserModel.findByEmail(payload.email)
          .then((user) => {
            const userId = user.getId();

            return UserRecoveryModel.findByUserId(userId);
          })
          .then((result) => {
            const token = result.getToken();
            const validateForgotParamsUrl = `/users/validate_forgot_params?token=${token}`;

            server.inject(validateForgotParamsUrl, (res) => {
              expect(res.statusCode).to.equal(200);
              expect(res.result).to.include.keys('status');
              expect(res.result.status).to.equal('success');

              done();
            });
          });
      });
    })
  });
});

describe('Recover', () => {
  let server;
  let stubSendEmail;

  beforeEach((done) => {
    server = new Hapi.Server();
    server.connection();

    server.register(plugins, () => {
      stubSendEmail = sinon.stub(server.methods.services.mailer, 'send');
      stubSendEmail.resolves();

      done();
    });
  });

  afterEach((done) => {
    stubSendEmail.restore();

    server.stop(done);
  });

  it('should return error with status 400 when request doesn\'t contain token', (done) => {
    const options = {
      method: 'POST',
      url: '/users/recover',
      payload: {}
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"token" is required');

      done();
    });
  });

  it('should return error with status 400 when token empty', (done) => {
    const payload = {
      token: ''
    };

    const options = {
      method: 'POST',
      url: '/users/recover',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"token" is not allowed to be empty');

      done();
    });
  });

  it('should return error with status 400 when request doesn\'t contain password', (done) => {
    const payload = {
      token: 'random-token'
    };

    const options = {
      method: 'POST',
      url: '/users/recover',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password" is required');

      done();
    });
  });

  it('should return error with status 400 when password empty', (done) => {
    const payload = {
      token: 'random-token',
      password: ''
    };

    const options = {
      method: 'POST',
      url: '/users/recover',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password" is not allowed to be empty');

      done();
    });
  });

  it('should return error with status 400 when password is not enough 8 chars', (done) => {
    const payload = {
      token: 'random-token',
      password: '1'
    };

    const options = {
      method: 'POST',
      url: '/users/recover',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password" length must be at least 8 characters long');

      done();
    });
  });

  it('should return error with status 400 when request doesn\'t contain password_confirmation', (done) => {
    const payload = {
      token: 'random-token',
      password: '12345678'
    };

    const options = {
      method: 'POST',
      url: '/users/recover',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password_confirmation" is required');

      done();
    });
  });

  it('should return error with status 400 when password_confirmation empty', (done) => {
    const payload = {
      token: 'random-token',
      password: '12345678',
      password_confirmation: ''
    };

    const options = {
      method: 'POST',
      url: '/users/recover',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password_confirmation" must match password');

      done();
    });
  });

  it('should update password when token and password valid', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: 'random-password',
      password_confirmation: 'random-password'
    };

    const createNewUserOptions = {
      method: 'POST',
      url: '/users/register',
      payload
    };

    server.inject(createNewUserOptions, (res) => {
      const request = res.request;
      const UserModel = request.getDb().getModel('User');
      const UserAccessTokenModel = request.getDb().getModel('UserAccessToken');
      const UserRecoveryModel = request.getDb().getModel('UserRecovery');

      const spySetUserPassword = sinon.spy(UserModel, 'setPassword');
      const spyInvalidateAccessToken = sinon.spy(UserAccessTokenModel, 'invalidateTokenByUserId');
      const spyInvalidateRecoveryToken = sinon.spy(UserRecoveryModel, 'invalidateToken');

      const forgotOptions = {
        method: 'POST',
        url: '/users/forgot',
        payload: {
          email: payload.email
        }
      };

      server.inject(forgotOptions, (res) => {
        UserModel.findByEmail(payload.email)
          .then((user) => {
            const userId = user.getId();

            return UserRecoveryModel.findByUserId(userId);
          })
          .then((result) => {
            const userId = result.getUserId();
            const token = result.getToken();
            const newPassword = 'new-password';

            const recoverOptions = {
              method: 'POST',
              url: '/users/recover',
              payload: {
                token,
                password: newPassword,
                password_confirmation: newPassword
              }
            };

            server.inject(recoverOptions, (res) => {
              expect(res.statusCode).to.equal(200);
              expect(res.result).to.include.keys('status');
              expect(res.result.status).to.equal('success');

              sinon.assert.calledWith(spySetUserPassword, userId, newPassword);
              sinon.assert.calledWith(spyInvalidateAccessToken, userId);
              sinon.assert.calledWith(spyInvalidateRecoveryToken, token);

              const loginNewPasswordOptions = {
                method: 'POST',
                url: '/users/login',
                payload: {
                  email: payload.email,
                  password: newPassword
                }
              };

              server.inject(loginNewPasswordOptions, (res) => {
                expect(res.statusCode).to.equal(200);
                expect(res.result).to.include.keys('access_token');

                done();
              });
            });
          });
      });
    });
  });
});
