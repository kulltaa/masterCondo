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

describe('Status', () => {
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
      expect(res.result.error.message).to.equal('Token invalid');

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
