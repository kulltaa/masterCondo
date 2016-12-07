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
const plugins = require('../../../libs/plugins');
require('sinon-as-promised')(Promise);

const expect = chai.expect;

describe('Create', () => {
  let server;
  let stubSendEmail;

  // before((done) => {
  //   server = new Hapi.Server();
  //   server.connection();
  //
  //   server.register(plugins, done);
  // });
  //
  // after((done) => {
  //   server.stop(done);
  // });

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

  it('should return error with status code 400 when email is empty', (done) => {
    const payload = {
      email: ''
    };

    const options = {
      method: 'POST',
      url: '/users/register',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"email" is not allowed to be empty');

      done();
    });
  });

  it('should return error with status code 400 when email format invalid', (done) => {
    const options = {
      method: 'POST',
      url: '/users/register',
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

  it('should return error with status code 400 when username is empty', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: ''
    };

    const options = {
      method: 'POST',
      url: '/users/register',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"username" is not allowed to be empty');

      done();
    });
  });

  it('should return error with status code 400 when username contains spaces', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: 'username with spaces'
    };

    const options = {
      method: 'POST',
      url: '/users/register',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"username" can only contain 0-9, a-z, A-Z, -, _, .');

      done();
    });
  });

  it('should return error with status code 400 when password is empty', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: ''
    };

    const options = {
      method: 'POST',
      url: '/users/register',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password" is not allowed to be empty');

      done();
    });
  });

  it('should return error with status code 400 when password is not enough 8 chars', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: '1'
    };

    const options = {
      method: 'POST',
      url: '/users/register',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password" length must be at least 8 characters long');

      done();
    });
  });

  it('should return error with status code 400 when password confirmation is empty', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: '12345678',
      password_confirmation: ''
    };

    const options = {
      method: 'POST',
      url: '/users/register',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password_confirmation" must match password');

      done();
    });
  });

  it('should return error with status code 400 when password confirmation doesn not match password', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: '12345678',
      password_confirmation: '987654321'
    };

    const options = {
      method: 'POST',
      url: '/users/register',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password_confirmation" must match password');

      done();
    });
  });

  it('should create new user success when data is valid', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: 'random-password',
      password_confirmation: 'random-password'
    };

    const options = {
      method: 'POST',
      url: '/users/register',
      payload
    };

    let UserModel;
    let UserAccessTokenModel;
    let UserEmailVerificationModel;

    let spyCreateEmailVerificationToken;
    let spyCreateEmailVerificationPayload;

    let spyCreateAccessToken;

    server.ext('onRequest', (request, reply) => {
      UserModel = request.getDb().getModel('User');
      UserAccessTokenModel = request.getDb().getModel('UserAccessToken');
      UserEmailVerificationModel = request.getDb().getModel('UserEmailVerification');

      spyCreateEmailVerificationToken = sinon.spy(UserEmailVerificationModel, 'createNewToken');
      spyCreateEmailVerificationPayload = sinon.spy(UserEmailVerificationModel, 'createEmailVerificationPayload');

      spyCreateAccessToken = sinon.spy(UserAccessTokenModel, 'createNewAccessToken');

      reply.continue();
    });

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.result).to.include.keys('access_token');

      const responseToken = res.result.access_token;

      UserModel.findByEmail(payload.email)
        .then((user) => {
          const userId = user.getId();
          const email = user.getEmail();

          expect(user).to.not.null;
          expect(user.getEmail()).to.equal(payload.email);
          expect(user.getUsername()).to.equal(payload.username);
          expect(UserModel.validatePassword(
            payload.password,
            user.getPasswordHash()
          )).to.equal.true;

          const getAccessToken = UserAccessTokenModel.findByUserId(userId);
          const getEmailVerificationToken = UserEmailVerificationModel.findByEmail(email);

          Promise.all([getAccessToken, getEmailVerificationToken])
            .then((results) => {
              const accessToken = results[0];
              expect(accessToken).to.not.null;
              expect(accessToken.getToken()).to.equal(responseToken);

              const emailVerificationToken = results[1];
              expect(emailVerificationToken).to.not.null;

              sinon.assert.calledWith(spyCreateEmailVerificationToken, email);
              sinon.assert.calledWith(
                spyCreateEmailVerificationPayload,
                email,
                emailVerificationToken.getToken()
              );

              const emailVerificationPayload = spyCreateEmailVerificationPayload.returnValues[0];
              sinon.assert.calledWith(stubSendEmail, emailVerificationPayload);

              sinon.assert.calledWith(spyCreateAccessToken, userId);

              spyCreateEmailVerificationToken.restore();
              spyCreateEmailVerificationPayload.restore();

              spyCreateAccessToken.restore();

              done();
            })
            .catch(error => done(error));
        });
    });
  });

  it('should return error with status code 500 when email already in use', (done) => {
    const options = {
      method: 'POST',
      url: '/users/register',
      payload: {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password: 'some-password',
        password_confirmation: 'some-password'
      }
    };

    server.inject(options, (res) => {
      server.inject(options, (res) => {
        expect(res.statusCode).to.equal(500);
        expect(res.result).to.include.keys('error');
        expect(res.result.error.message).to.equal('Email already in use');

        done();
      });
    });
  });

  it('should return error with status code 500 when username already in use', (done) => {
    const options = {
      method: 'POST',
      url: '/users/register',
      payload: {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password: 'some-password',
        password_confirmation: 'some-password'
      }
    };

    server.inject(options, (res) => {

      options.payload.email = faker.internet.email();
      server.inject(options, (res) => {
        expect(res.statusCode).to.equal(500);
        expect(res.result).to.include.keys('error');
        expect(res.result.error.message).to.equal('Username already in use');

        done();
      });
    });
  });
});

describe('Verify', () => {
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

  it('should return error with status 400 when verify link doesn\'t contain email', (done) => {
    const options = {
      method: 'GET',
      url: '/users/verify'
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"email" is required');

      done();
    });
  });

  it('should return error with status 400 when verify link doesn\'t contain token', (done) => {
    const email = 'mailer@example.com';
    const options = {
      method: 'GET',
      url: `/users/verify?email=${email}`
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"token" is required');

      done();
    });
  });

  it('should return error with status 401 when email/token invalid', (done) => {
    const invalidEmail = 'invalid@mail.com';
    const invalidToken = 'invalid-token';

    const verificationUrl = `/users/verify?email=${invalidEmail}&token=${invalidToken}`;

    server.inject(verificationUrl, (res) => {
      expect(res.statusCode).to.equal(401);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('Email/Token invalid');

      done();
    });
  });

  it('should verify user when email/token valid', (done) => {
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
      const UserEmailVerificationModel = res.request.getDb().getModel('UserEmailVerification');

      UserModel.findByEmail(payload.email)
        .then((user) => {
          const userId = user.getId();

          return UserEmailVerificationModel.findByEmail(payload.email)
        })
        .then((token) => {
          const encodedEmail = encodeURIComponent(payload.email);
          const encodedToken = encodeURIComponent(token.getToken());
          const verificationUrl = `/users/verify?email=${encodedEmail}&token=${encodedToken}`;

          server.inject(verificationUrl, (res) => {
            expect(res.statusCode).to.equal(200);

            UserModel.findByEmail(payload.email)
              .then((user) => {
                expect(user.getStatus()).to.equal(true);
                done();
              })
              .catch(error => done(error));
          });
        });
    });
  });
});

describe('Login', () => {
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

  it('should return error with status code 400 when email is empty', (done) => {
    const payload = {
      email: ''
    };

    const options = {
      method: 'POST',
      url: '/users/login',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('Please check your email/password again');

      done();
    });
  });

  it('should return error with status code 400 when email format invalid', (done) => {
    const options = {
      method: 'POST',
      url: '/users/login',
      payload: {
        email: 'invalid-email'
      }
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('Please check your email/password again');

      done();
    });
  });

  it('should return error with status code 400 when password is empty', (done) => {
    const payload = {
      email: faker.internet.email(),
      password: ''
    };

    const options = {
      method: 'POST',
      url: '/users/login',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('Please check your email/password again');

      done();
    });
  });

  it('should return error with status code 404 when email has not been registered', (done) => {
    const payload = {
      email: faker.internet.email(),
      password: 'random-password'
    };

    const options = {
      method: 'POST',
      url: '/users/login',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(404);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('Email does not exist');

      done();
    });
  });

  it('should return error with status code 401 when password is incorrect', (done) => {
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

    const loginOptions = {
      method: 'POST',
      url: '/users/login',
      payload: {
        email: payload.email,
        password: 'wrong-password'
      }
    };

    server.inject(createNewUserOptions, (res) => {
      server.inject(loginOptions, (res) => {
        expect(res.statusCode).to.equal(401);
        expect(res.result).to.include.keys('error');
        expect(res.result.error.message).to.equal('Please check your email/password again');

        done();
      });
    });
  });

  it('should return access token when email/password correct', (done) => {
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

    const loginOptions = {
      method: 'POST',
      url: '/users/login',
      payload: {
        email: payload.email,
        password: payload.password
      }
    };

    server.inject(createNewUserOptions, (res) => {
      server.inject(loginOptions, (res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.result).to.include.keys('access_token');
        expect(res.result.access_token).to.not.empty;

        done();
      });
    });
  });
});

describe('Recover', () => {
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
      url: '/users/recover',
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
      url: '/users/recover',
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
      url: '/users/recover',
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
      url: '/users/recover',
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

    const recoverOptions = {
      method: 'POST',
      url: '/users/recover',
      payload: {
        email: payload.email
      }
    };

    server.inject(createNewUserOptions, (res) => {
      const request = res.request;
      const UserRecoveryModel = request.getDb().getModel('UserRecovery');

      const spyCreateEmailRecoveryToken = sinon.spy(UserRecoveryModel, 'createNewToken');
      const spyCreateEmailRecoveryPayload = sinon.spy(UserRecoveryModel, 'createEmailRecoveryPayload');

      server.inject(recoverOptions, (res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.result).to.include.keys('status');
        expect(res.result.status).to.equal('success');

        sinon.assert.calledWith(spyCreateEmailRecoveryToken, payload.email);

        UserRecoveryModel.findByEmail(payload.email)
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

describe('Status', () => {
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

  it('should return error with status 401 when request doesn\'t contain token', (done) => {
    const options = {
      method: 'GET',
      url: '/users/status'
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(401);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('An access token is required to request this resource.');

      done();
    });
  });

  it('should return error with status 401 when token is invalid', (done) => {
    const invalidToken = 'invalid-token';
    const options = {
      method: 'GET',
      url: '/users/status',
      headers: {
        Authorization: `Bearer ${invalidToken}`
      }
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(401);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('Invalid access token');

      done();
    });
  });

  it('should return user status when token is valid', (done) => {
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

    const loginOptions = {
      method: 'POST',
      url: '/users/login',
      payload: {
        email: payload.email,
        password: payload.password
      }
    };

    server.inject(createNewUserOptions, (res) => {
      server.inject(loginOptions, (res) => {
        const token = res.result.access_token;

        const options = {
          method: 'GET',
          url: '/users/status',
          headers: {
            Authorization: `Bearer ${token}`
          }
        };

        server.inject(options, (res) => {
          expect(res.statusCode).to.equal(200);
          expect(res.result).to.include.keys('is_active');

          done();
        });
      });
    });
  });
});
