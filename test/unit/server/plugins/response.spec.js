/* eslint-disable */
const Hapi = require('hapi');
const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire');
const respSuccess = require('../../../../libs/plugins/responses/success');
const respBadRequest = require('../../../../libs/plugins/responses/badRequest');
const respUnauthorized = require('../../../../libs/plugins/responses/unauthorized');
const respNotFound = require('../../../../libs/plugins/responses/notFound');
const respServerError = require('../../../../libs/plugins/responses/serverError');

const expect = chai.expect;

describe('Response', () => {
  let server;

  let spySuccess;
  let spyBadRequest;
  let spyUnauthorized;
  let spyNotFound;
  let spyServerError;

  beforeEach((done) => {
    spySuccess = sinon.spy(respSuccess, 'handler');
    spyBadRequest = sinon.spy(respBadRequest, 'handler');
    spyUnauthorized = sinon.spy(respUnauthorized, 'handler');
    spyNotFound = sinon.spy(respNotFound, 'handler');
    spyServerError = sinon.spy(respServerError, 'handler');

    const responsePlugin = proxyquire('../../../../libs/plugins/response', {
      './responses/success': {
        handler: spySuccess
      },
      './responses/badRequest': {
        handler: spyBadRequest
      },
      './responses/unauthorized': {
        handler: spyUnauthorized
      },
      './responses/notFound': {
        handler: spyNotFound
      },
      './responses/serverError': {
        handler: spyServerError
      }
    });

    server = new Hapi.Server();
    server.connection();

    server.register(responsePlugin, done);
  });

  afterEach((done) => {
    spySuccess.restore();
    spyBadRequest.restore();
    spyUnauthorized.restore();
    spyNotFound.restore();
    spyServerError.restore();

    server.stop(done);
  });

  it('should register response plugin success', (done) => {
    server.ext('onRequest', (request, reply) => {
      expect(reply.success).to.be.an.instanceof(Function);
      expect(reply.badRequest).to.be.an.instanceof(Function);
      expect(reply.unauthorized).to.be.an.instanceof(Function);
      expect(reply.notFound).to.be.an.instanceof(Function);
      expect(reply.serverError).to.be.an.instanceof(Function);

      done();
    });

    server.inject('/');
  });

  it('reply success should return response and status code 200', (done) => {
    const expected = {
      data: []
    };

    server.route({
      method: 'GET',
      path: '/',
      handler(request, reply) {
        return reply.success(expected);
      }
    });

    server.inject('/', (res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.result).to.deep.equal(expected);
      sinon.assert.calledWith(spySuccess, expected);

      done();
    });
  });

  it('reply badRequest should return status code 400', (done) => {
    const response = new Error('Bad Request Message');
    const expected = {
      error: {
        message: 'Bad Request Message'
      }
    };

    server.route({
      method: 'GET',
      path: '/',
      handler(request, reply) {
        return reply.badRequest(response);
      }
    });

    server.inject('/', (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.deep.equal(expected);
      sinon.assert.calledWith(spyBadRequest, response);

      done();
    });
  });

  it('reply unauthorized should return status code 401', (done) => {
    const response = new Error('Unauthorized Message');
    const expected = {
      error: {
        message: 'Unauthorized Message'
      }
    };

    server.route({
      method: 'GET',
      path: '/',
      handler(request, reply) {
        return reply.unauthorized(response);
      }
    });

    server.inject('/', (res) => {
      expect(res.statusCode).to.equal(401);
      expect(res.result).to.deep.equal(expected);
      sinon.assert.calledWith(spyUnauthorized, response);

      done();
    });
  });

  it('reply notFound should return status code 404', (done) => {
    const response = new Error('Not Found Message');
    const expected = {
      error: {
        message: 'Not Found Message'
      }
    };

    server.route({
      method: 'GET',
      path: '/',
      handler(request, reply) {
        return reply.notFound(response);
      }
    });

    server.inject('/', (res) => {
      expect(res.statusCode).to.equal(404);
      expect(res.result).to.deep.equal(expected);
      sinon.assert.calledWith(spyNotFound, response);

      done();
    });
  });

  it('reply serverError should return response and status code 500', (done) => {
    const response = new Error('Server Error Message');
    const expected = {
      error: {
        message: 'Server Error Message'
      }
    };

    server.route({
      method: 'GET',
      path: '/',
      handler(request, reply) {
        return reply.serverError(response);
      }
    });

    server.inject('/', (res) => {
      expect(res.statusCode).to.equal(500);
      expect(res.result).to.deep.equal(expected);
      sinon.assert.calledWith(spyServerError, response);

      done();
    });
  });
});
