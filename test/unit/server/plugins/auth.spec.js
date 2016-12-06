/* eslint-disable */
const Hapi = require('hapi');
const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire');
const responsePlugin = require('../../../../libs/plugins/response');
const authToken = require('../../../../libs/plugins/auth/token');

const expect = chai.expect;

describe('Auth', () => {

  describe('Token', () => {
    let stub;
    let server;

    beforeEach((done) => {
      stub = sinon.stub(authToken.options, 'validateFunc');

      const authPlugin = proxyquire('../../../../libs/plugins/auth', {
        './auth/token': {
          options: {
            validateFunc: stub
          }
        }
      });

      server = new Hapi.Server();
      server.connection();

      server.register([
        {
          register: responsePlugin
        },
        {
          register: authPlugin
        }
      ], done);
    });

    afterEach((done) => {
      stub.restore();
      server.stop(done);
    });

    it('should return error with status 401 when request doesn\'t contain token', (done) => {
      server.route({
        method: 'GET',
        path: '/',
        config: {
          auth: 'auth-access-token',
          handler(request, reply) {

          }
        }
      });

      server.inject('/', (res) => {
        expect(res.statusCode).to.equal(401);
        expect(res.result).to.include.keys('error');
        expect(res.result.error.message).to.equal('An access token is required to request this resource.');

        done();
      });
    });

    it('should return error with status code 401 when token is invalid', (done) => {
      const credentials = {
        username: 'some-username'
      };

      stub.yields(null, { isValid: false });

      const token = 'some-access-token';
      const options = {
        method: 'GET',
        url: '/',
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      server.route({
        method: 'GET',
        path: '/',
        handler (request, reply) {
          request.server.auth.test('auth-access-token', request, (error, result) => {
            if (error) {
              return reply(error);
            }

            return reply(result);
          });
        }
      });

      server.inject(options, (res) => {
        expect(res.statusCode).to.equal(401);
        expect(res.result).to.include.keys('error');
        expect(res.result.error.message).to.equal('Invalid access token');
        sinon.assert.calledWith(stub, token);

        done();
      });
    });

    it('should return error with status code 401 when token is expired', (done) => {
      const credentials = {
        username: 'some-username'
      };

      stub.yields(null, { isExpired: true });

      const token = 'some-access-token';
      const options = {
        method: 'GET',
        url: '/',
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      server.route({
        method: 'GET',
        path: '/',
        handler (request, reply) {
          request.server.auth.test('auth-access-token', request, (error, result) => {
            if (error) {
              return reply(error);
            }

            return reply(result);
          });
        }
      });

      server.inject(options, (res) => {
        expect(res.statusCode).to.equal(401);
        expect(res.result).to.include.keys('error');
        expect(res.result.error.message).to.equal('Token is expired');
        sinon.assert.calledWith(stub, token);

        done();
      });
    });

    it('should return credentials when token is valid', (done) => {
      const credentials = {
        username: 'some-username'
      };

      stub.yields(null, { credentials });

      const token = 'some-access-token';
      const options = {
        method: 'GET',
        url: '/',
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      server.route({
        method: 'GET',
        path: '/',
        handler (request, reply) {
          request.server.auth.test('auth-access-token', request, (error, result) => {
            if (error) {
              return reply(error);
            }

            return reply(result);
          });
        }
      });

      server.inject(options, (res) => {
        expect(res.statusCode).to.equal(200);
        expect(res.result).to.deep.equal(credentials);
        sinon.assert.calledWith(stub, token);

        done();
      });
    });
  });
});
