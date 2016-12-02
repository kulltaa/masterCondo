/* eslint-disable */
const Hapi = require('hapi');
const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire');
const authToken = require('../../../../libs/plugins/auth/token');

const expect = chai.expect;

describe('Auth', () => {

  describe('Token', () => {
    let stub;
    let server;

    beforeEach((done) => {
      // stub = sinon.stub(authToken.options, 'validateFunc');

      // const authPlugin = proxyquire('../../../../libs/plugins/auth', {
      //   './auth/token': {
      //     options: {
      //       validateFunc: stub
      //     }
      //   }
      // });

      server = new Hapi.Server();
      server.connection();

      server.register(authToken, done);
    });

    afterEach((done) => {
      // stub.restore();
      server.stop(done);
    });

    it.only('should return credentials when request is valid', (done) => {
      const credentials = {
        username: 'some-username'
      };

      stub.yields(null, true, credentials);

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
          request.server.auth.test(authToken.name, request, (error, credentials) => {
            if (error) {
              return reply(error);
            }

            return reply(credentials);
          });
        }
      });

      server.inject(options, (res) => {
        sinon.assert.calledWith(stub, token);
        expect(res.result).to.deep.equal(credentials);

        done();
      });
    });
  });
});
