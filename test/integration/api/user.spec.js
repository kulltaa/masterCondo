/* eslint-disable */
require('dotenv').config();

const Hapi = require('hapi');
const chai = require('chai');
const faker = require('faker');
const plugins = require('../../../libs/plugins');

const expect = chai.expect;

describe('User', () => {
  let server;

  before((done) => {
    server = new Hapi.Server();
    server.connection();

    server.register(plugins, done);
  });

  after((done) => {
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
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"email" is not allowed to be empty');

      done();
    });
  });

  it('should return error with status code 400 when email is not valid', (done) => {
    const payload = {
      email: 'not-valid-email'
    };

    const options = {
      method: 'POST',
      url: '/users',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"email" must be a valid email');

      done();
    });
  });

  it('should return error with status code 400 when username is empty', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: ''
    };

    const options = {
      method: 'POST',
      url: '/users',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"username" is not allowed to be empty');

      done();
    });
  });

  it('should return error with status code 400 when password is empty', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: ''
    };

    const options = {
      method: 'POST',
      url: '/users',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password" is not allowed to be empty');

      done();
    });
  });

  it('should return error with status code 400 when password is not enough 8 chars', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: '1'
    };

    const options = {
      method: 'POST',
      url: '/users',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password" length must be at least 8 characters long');

      done();
    });
  });

  it('should return error with status code 400 when password confirmation is empty', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
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
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password_confirmation" must match password');

      done();
    });
  });

  it('should return error with status code 400 when password confirmation doesn not match password', (done) => {
    const payload = {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: '12345678',
      password_confirmation: '987654321'
    };

    const options = {
      method: 'POST',
      url: '/users',
      payload
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(400);
      expect(res.result).to.include.keys('error');
      expect(res.result.error.message).to.equal('"password_confirmation" must match password');

      done();
    });
  });

  it('should create new user success when data is valid', (done) => {
    const options = {
      method: 'POST',
      url: '/users',
      payload: {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password: 'some-password',
        password_confirmation: 'some-password'
      }
    };

    server.inject(options, (res) => {
      expect(res.statusCode).to.equal(200);
      expect(res.result.id).to.not.undefined;

      done();
    });
  });

  it('shoudl return error with status code 500 when email already in use', (done) => {
    const email = faker.internet.email();

    const options = {
      method: 'POST',
      url: '/users',
      payload: {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password: 'some-password',
        password_confirmation: 'some-password'
      }
    };

    server.inject(options, (res) => {
      server.inject(options, (res) => {
        expect(res.statusCode).to.equal(500);
        expect(res.result).to.include.keys('error');
        expect(res.result.error.message).to.equal('Email already in use');

        done();
      });
    });
  });

  it('shoudl return error with status code 500 when username already in use', (done) => {
    const options = {
      method: 'POST',
      url: '/users',
      payload: {
        email: faker.internet.email(),
        username: faker.internet.userName(),
        password: 'some-password',
        password_confirmation: 'some-password'
      }
    };

    server.inject(options, (res) => {

      options.payload.email = faker.internet.email();
      server.inject(options, (res) => {
        expect(res.statusCode).to.equal(500);
        expect(res.result).to.include.keys('error');
        expect(res.result.error.message).to.equal('Username already in use');

        done();
      });
    });
  });
});
