var log = require('logger')('service-messages:test:create');
var errors = require('errors');
var _ = require('lodash');
var should = require('should');
var request = require('request');
var pot = require('pot');

describe('POST /messages', function () {
    var client;
    before(function (done) {
        pot.client(function (err, c) {
            if (err) {
                return done(err);
            }
            client = c;
            done();
        });
    });

    var data = {
        to: '5ddb57c91679b3e1b34379fd',
        model: 'vehicles',
        about: '5ddb57c91679b3e1b34379fd',
        type: 'violation',
        body: 'This is a sample post'
    };

    it('with no media type', function (done) {
        request({
            uri: pot.resolve('apis', '/v/messages'),
            method: 'POST',
            auth: {
                bearer: client.users[0].token
            }
        }, function (e, r, b) {
            if (e) {
                return done(e);
            }
            r.statusCode.should.equal(errors.unsupportedMedia().status);
            should.exist(b);
            b = JSON.parse(b);
            should.exist(b.code);
            should.exist(b.message);
            b.code.should.equal(errors.unsupportedMedia().data.code);
            done();
        });
    });

    it('with unsupported media type', function (done) {
        request({
            uri: pot.resolve('apis', '/v/messages'),
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml'
            },
            auth: {
                bearer: client.users[0].token
            }
        }, function (e, r, b) {
            if (e) {
                return done(e);
            }
            r.statusCode.should.equal(errors.unsupportedMedia().status);
            should.exist(b);
            b = JSON.parse(b);
            should.exist(b.code);
            should.exist(b.message);
            b.code.should.equal(errors.unsupportedMedia().data.code);
            done();
        });
    });

    it('without body', function (done) {
      request({
        uri: pot.resolve('apis', '/v/messages'),
        method: 'POST',
        json: {},
        auth: {
          bearer: client.users[0].token
        }
      }, function (e, r, b) {
        if (e) {
          return done(e);
        }
        r.statusCode.should.equal(errors.unprocessableEntity().status);
        should.exist(b);
        should.exist(b.code);
        should.exist(b.message);
        b.code.should.equal(errors.unprocessableEntity().data.code);
        done();
      });
    });

    it('without type', function (done) {
      request({
        uri: pot.resolve('apis', '/v/messages'),
        method: 'POST',
        json: {
          body: 'Body'
        },
        auth: {
          bearer: client.users[0].token
        }
      }, function (e, r, b) {
        if (e) {
          return done(e);
        }
        r.statusCode.should.equal(errors.unprocessableEntity().status);
        should.exist(b);
        should.exist(b.code);
        should.exist(b.message);
        b.code.should.equal(errors.unprocessableEntity().data.code);
        done();
      });
    });

    it('without to', function (done) {
      request({
        uri: pot.resolve('apis', '/v/messages'),
        method: 'POST',
        json: {
          type: 'violation',
          body: 'Body'
        },
        auth: {
          bearer: client.users[0].token
        }
      }, function (e, r, b) {
        if (e) {
          return done(e);
        }
        r.statusCode.should.equal(errors.unprocessableEntity().status);
        should.exist(b);
        should.exist(b.code);
        should.exist(b.message);
        b.code.should.equal(errors.unprocessableEntity().data.code);
        done();
      });
    });

    var bigger = '';
    var i;
    for (i = 0; i < 200001; i++) {
        bigger += 'x';
    }

    it('with bigger body', function (done) {
      request({
        uri: pot.resolve('apis', '/v/messages'),
        method: 'POST',
        json: {
          to: '5ddb57c91679b3e1b34379fd',
          type: 'violation',
          body: bigger
        },
        auth: {
          bearer: client.users[0].token
        }
      }, function (e, r, b) {
        if (e) {
          return done(e);
        }
        r.statusCode.should.equal(errors.payloadTooLarge().status);
        should.exist(b);
        should.exist(b.code);
        should.exist(b.message);
        b.code.should.equal(errors.payloadTooLarge().data.code);
        done();
      });
    });

    it('valid', function (done) {
        request({
            uri: pot.resolve('apis', '/v/messages'),
            method: 'POST',
            json: data,
            auth: {
                bearer: client.users[0].token
            }
        }, function (e, r, b) {
            if (e) {
                return done(e);
            }
            r.statusCode.should.equal(201);
            should.exist(b);
            should.exist(b.body);
            b.body.should.equal(data.body);
            should.exist(r.headers['location']);
            r.headers['location'].should.equal(pot.resolve('apis', '/v/messages/' + b.id));
            done();
        });
    });
});
