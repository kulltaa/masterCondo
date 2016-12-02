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

  before((done) => {
    server = new Hapi.Server();
    server.connection();

    server.register(plugins, done);
  });

  after((done) => {
    server.stop(done);
  });

  beforeEach(() => {
    stubSendEmail = sinon.stub(server.methods.services.mailer, 'send');
    stubSendEmail.resolves();
  });

  afterEach(() => {
    stubSendEmail.restore();
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
    const payload = {
      email: 'invalid-email'
    };

    const options = {
      method: 'POST',
      url: '/users/register',
      payload
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
    const options = {
      method: 'POST',
      url: '/users/register',
      payload: {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password: 'random-password',
        password_confirmation: 'random-password'
      }
    };

    const emailPayload = {
      to: options.payload.email,
      subject: 'test subject',
      html: 'test html email content'
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.result).to.include.keys('access_token');
      expect(res.result.access_token).to.not.empty;
      sinon.assert.calledWith(stubSendEmail, emailPayload);

      done();
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

describe('Login', () => {
  before((done) => {
    server = new Hapi.Server();
    server.connection();

    server.register(plugins, done);
  });

  after((done) => {
    server.stop(done);
  });

  beforeEach(() => {
    stubSendEmail = sinon.stub(server.methods.services.mailer, 'send');
    stubSendEmail.resolves();
  });

  afterEach(() => {
    stubSendEmail.restore();
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
    const payload = {
      email: 'invalid-email'
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

describe('Status', () => {
  before((done) => {
    server = new Hapi.Server();
    server.connection();

    server.register(plugins, done);
  });

  after((done) => {
    server.stop(done);
  });

  beforeEach(() => {
    stubSendEmail = sinon.stub(server.methods.services.mailer, 'send');
    stubSendEmail.resolves();
  });

  afterEach(() => {
    stubSendEmail.restore();
  });

  it.only('should return error with status 401 when token invalid', (done) => {
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
