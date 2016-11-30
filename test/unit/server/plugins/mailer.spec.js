/* eslint-disable */
const Hapi = require('hapi');
const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire');
const Mailer = require('../../../../api/services/Mailer');

const expect = chai.expect;

describe('Mailer', () => {
  let stub;
  let server;

  beforeEach((done) => {
    stub = sinon.stub(Mailer, 'send');

    const mailerPlugin = proxyquire('../../../../libs/plugins/mailer', {
      '../../api/services/Mailer': {
        send: stub
      }
    });

    server = new Hapi.Server();
    server.connection();

    server.register(mailerPlugin, done);
  });

  afterEach((done) => {
    stub.restore();
    server.stop(done);
  });

  it('should register mailer plugin success', (done) => {
    expect(server.methods.services.mailer.send).to.be.an.instanceof(Function);

    done();
  });

  it('send email from request object should call send in Mailer service', (done) => {
    const options = {};

    server.ext('onRequest', (request, reply) => {
      request.server.methods.services.mailer.send(options);

      expect(request.server.methods.services.mailer.send).to.be.an.instanceof(Function);
      sinon.assert.calledWith(stub, options);

      done();
    });

    server.inject('/');
  });
});
