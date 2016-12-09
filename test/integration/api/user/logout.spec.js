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

describe('Logout', () => {
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

  it('should return error with status code 400 when request doesn\'t contain token', (done) => {
    const options = {
      method: 'POST',
      url: '/users/logout'
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);

      done();
    });
  });

  it('should return error with status code 400 when token empty', (done) => {
    const options = {
      method: 'POST',
      url: '/users/logout',
      payload: {
        access_token: ''
      }
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);

      done();
    });
  });

  it('should return error with status code 401 when token invalid', (done) => {
    const options = {
      method: 'POST',
      url: '/users/logout',
      payload: {
        access_token: 'invalid-token'
      }
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(401);

      done();
    });
  });

  it('should return error with status code 401 when token inactive', (done) => {
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
      const UserAccessTokenModel = request.getDb().getModel('UserAccessToken');
      const token = res.result.access_token;

      UserAccessTokenModel.invalidateToken(token)
        .then((tokenRecord) => {
          const logoutOptions = {
            method: 'POST',
            url: '/users/logout',
            payload: {
              access_token: token
            }
          };

          server.inject(logoutOptions, (res) => {
            expect(res.statusCode).to.equal(401);
            expect(res.result).to.include.keys('error');
            expect(res.result.error.message).to.equal('Token invalid');

            done();
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
      const UserAccessTokenModel = request.getDb().getModel('UserAccessToken');
      const token = res.result.access_token;

      const logoutOptions = {
        method: 'POST',
        url: '/users/logout',
        payload: {
          access_token: token
        }
      };

      server.inject(logoutOptions, (res) => {
        expect(res.statusCode).to.equal(200);

        UserAccessTokenModel.findByToken(token)
          .then((tokenRecord) => {
            expect(tokenRecord.getStatus()).to.equal(false);

            done();
          });
      });
    });
  });
});
