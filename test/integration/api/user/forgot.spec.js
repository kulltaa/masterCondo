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
      const UserRecoveryModel = request.getDb().getModel('UserRecovery');

      const spyCreateEmailRecoveryToken = sinon.spy(UserRecoveryModel, 'createNewToken');
      const spyCreateEmailRecoveryPayload = sinon.spy(UserRecoveryModel, 'createEmailRecoveryPayload');

      server.inject(forgotOptions, (res) => {
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
