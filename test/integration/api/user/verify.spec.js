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

  it('should return error with status 400 when verify link doesn\'t contain token', (done) => {
    const email = 'mailer@example.com';
    const options = {
      method: 'GET',
      url: `/users/verify`
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

    const verificationUrl = `/users/verify?token=${invalidToken}`;

    server.inject(verificationUrl, (res) => {
      expect(res.statusCode).to.equal(401);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('Token invalid');

      done();
    });
  });

  it('should verify user when token valid', (done) => {
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

          return UserEmailVerificationModel.findByUserId(userId);
        })
        .then((token) => {
          const encodedToken = encodeURIComponent(token.getToken());
          const verificationUrl = `/users/verify?token=${encodedToken}`;

          server.inject(verificationUrl, (res) => {
            expect(res.statusCode).to.equal(200);
            expect(res.result).to.include.keys('status');
            expect(res.result.status).to.equal('success');

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
