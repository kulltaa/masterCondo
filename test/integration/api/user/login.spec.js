/* eslint-disable */
require('dotenv').config({ silent: true });

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

describe('Login', () => {
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
