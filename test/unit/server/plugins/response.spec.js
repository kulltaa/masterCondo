/* eslint-disable */
const Hapi = require('hapi');
const chai = require('chai');
const responsePlugin = require('../../../../libs/plugins/response');

const expect = chai.expect;

describe('Response', () => {
  let server;

  beforeEach((done) => {
    server = new Hapi.Server();
    server.connection();

    server.register(responsePlugin, done);
  })

  afterEach((done) => {
    process.env.NODE_ENV = 'development';

    server.stop(done);
  })

  it('should register response plugin success', (done) => {
    server.ext('onRequest', (request, reply) => {
      expect(reply.success).to.be.an.instanceof(Function);
      expect(reply.badRequest).to.be.an.instanceof(Function);
      expect(reply.notFound).to.be.an.instanceof(Function);
      expect(reply.serverError).to.be.an.instanceof(Function);

      done();
    });

    server.inject('/');
  });

  it('reply success should return response and status code 200', (done) => {
    const expectedResponse = {
      data: []
    };

    server.route({
      method: 'GET',
      path: '/',
      handler(request, reply) {
        return reply.success(expectedResponse);
      }
    });

    server.inject('/', (res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.result).to.deep.equal(expectedResponse);

      done();
    });
  });

  it('reply badRequest should return status code 400', (done) => {
    const expectedResponse = {
      data: []
    };

    server.route({
      method: 'GET',
      path: '/',
      handler(request, reply) {
        return reply.badRequest();
      }
    });

    server.inject('/', (res) => {
      expect(res.statusCode).to.equal(400);

      done();
    });
  });

  it('reply notFound should return status code 404', (done) => {
    server.route({
      method: 'GET',
      path: '/',
      handler(request, reply) {
        return reply.notFound();
      }
    });

    server.inject('/', (res) => {
      expect(res.statusCode).to.equal(404);

      done();
    });
  });

  it('in development, reply serverError should return response and status code 500', (done) => {
    const expectedResponse = {
      data: []
    };

    server.route({
      method: 'GET',
      path: '/',
      handler(request, reply) {
        return reply.serverError(expectedResponse);
      }
    });

    server.inject('/', (res) => {
      expect(res.statusCode).to.equal(500);
      expect(res.result).to.deep.equal(expectedResponse);

      done();
    });
  });

  it('in production, reply serverError should return empty response and status code 500', (done) => {
    process.env.NODE_ENV = 'production';

    const expectedResponse = {
      data: []
    };

    server.route({
      method: 'GET',
      path: '/',
      handler(request, reply) {
        return reply.serverError(expectedResponse);
      }
    });

    server.inject('/', (res) => {
      expect(res.statusCode).to.equal(500);
      expect(res.result).to.not.deep.equal(expectedResponse);

      done();
    });
  });
});
