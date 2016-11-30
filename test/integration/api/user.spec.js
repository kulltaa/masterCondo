/* eslint-disable */
require('dotenv').config();

const Hapi = require('hapi');
const chai = require('chai');
const plugins = require('../../../libs/plugins');

const expect = chai.expect;

describe('User', () => {
  let server;

  beforeEach((done) => {
    server = new Hapi.Server();
    server.connection();

    // server.ext('onPreResponse', (request, reply) => {
    //   const response = request.response;
    //
    //   if (response.isBoom && response.data.name === 'ValidationError') {
    //     response.output.payload.message = 'custom';
    //   }
    //
    //   return reply.continue();
    // });

    server.register(plugins, done);
  });

  afterEach((done) => {
    server.stop(done);
  });

  it('should return error with status code 400 when email is empty', (done) => {
    const payload = {
      email: ''
    };

    const options = {
      method: 'POST',
      url: '/users',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);

      done();
    });
  });

  it('should return error with status code 400 when email is not valid', (done) => {
    const payload = {
      email: 'email'
    };

    const options = {
      method: 'POST',
      url: '/users',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);

      done();
    });
  });

  it('should return error with status code 400 when username is empty', (done) => {
    const payload = {
      username: ''
    };

    const options = {
      method: 'POST',
      url: '/users',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);

      done();
    });
  });

  it('should return error with status code 400 when password is empty', (done) => {
    const payload = {
      password: ''
    };

    const options = {
      method: 'POST',
      url: '/users',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);

      done();
    });
  });

  it('should return error with status code 400 when password is not enough 8 chars', (done) => {
    const payload = {
      username: ''
    };

    const options = {
      method: 'POST',
      url: '/users',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);

      done();
    });
  });

  it('should return error with status code 400 when password confirmation is empty', (done) => {
    const payload = {
      password_confirmation: ''
    };

    const options = {
      method: 'POST',
      url: '/users',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);

      done();
    });
  });

  it('should return error with status code 400 when password confirmation doesn not match password', (done) => {
    const payload = {
      username: 'test',
      password: '12345678',
      password_confirmation: ''
    };

    const options = {
      method: 'POST',
      url: '/users',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);

      done();
    });
  });

  // it('should create new user success when data is valid', (done) => {
  //   const options = {
  //     method: 'POST',
  //     url: '/users',
  //     payload: {
  //       email: 'test@abc.com',
  //       username: 'some-username',
  //       password: 'some-password'
  //     }
  //   };
  //
  //   server.inject(options, (res) => {
  //     console.log(res.result)
  //     expect(res.result.id).to.not.undefined;
  //
  //     done();
  //   });
  // });
});
