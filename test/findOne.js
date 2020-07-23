var log = require('logger')('service-messages:test:find');
var async = require('async');
var errors = require('errors');
var _ = require('lodash');
var should = require('should');
var utils = require('utils');
var request = require('request');
var pot = require('pot');

describe('GET /messages', function () {
    var client;
    var groups;
    before(function (done) {
        pot.drop('messages', function (err) {
            if (err) {
                return done(err);
            }
            pot.client(function (err, c) {
                if (err) {
                    return done(err);
                }
                client = c;
                pot.groups(function (err, g) {
                    if (err) {
                        return done(err);
                    }
                    groups = g;
                    createMessages(client.users[0], client.users[2], 1, function (err) {
                        if (err) {
                            return done(err);
                        }
                        createMessages(client.users[1], client.users[2], 1, done);
                    });
                });
            });
        });
    });

    var data = {
        to: '5ddb57c91679b3e1b34379fd',
        model: 'vehicles',
        about: '5ddb57c91679b3e1b34379fd',
        type: 'violation',
        body: 'This is a sample post'
    };

    var validateMessages = function (messages) {
        messages.forEach(function (message) {
            should.exist(message.id);
            should.exist(message.user);
            should.exist(message.createdAt);
            should.exist(message.modifiedAt);
            should.exist(message.type);
            should.exist(message.to);
            should.exist(message.body);
            should.not.exist(message._id);
            should.not.exist(message.__v);
        });
    };

    var payload = function (to) {
        var clone = _.cloneDeep(data);
        clone.to = to;
        return clone;
    };

    var createMessages = function (user, to, count, done) {
        async.whilst(function () {
            return count-- > 0
        }, function (created) {
            var message = payload(to.profile.id);
            request({
                uri: pot.resolve('apis', '/v/messages'),
                method: 'POST',
                auth: {
                    bearer: user.token
                },
                json: message
            }, function (e, r, b) {
                if (e) {
                    return created(e);
                }
                r.statusCode.should.equal(201);
                should.exist(b);
                should.exist(b.id);
                should.exist(b.body);
                b.body.should.equal(message.body);
                should.exist(r.headers['location']);
                r.headers['location'].should.equal(pot.resolve('apis', '/v/messages/' + b.id));
                created();
            });
        }, done);
    };

    it('invalid id', function (done) {
        request({
            uri: pot.resolve('apis', '/v/messages/undefined'),
            method: 'GET',
            auth: {
                bearer: client.users[0].token
            },
            json: true
        }, function (e, r, b) {
            if (e) {
                return done(e);
            }
            r.statusCode.should.equal(errors.notFound().status);
            should.exist(b);
            should.exist(b.code);
            should.exist(b.message);
            b.code.should.equal(errors.notFound().data.code);
            done();
        });
    });

    it('owner and receiver can access', function (done) {
        request({
            uri: pot.resolve('apis', '/v/messages'),
            method: 'GET',
            auth: {
                bearer: client.users[0].token
            },
            json: true
        }, function (e, r, b) {
            if (e) {
                return done(e);
            }
            r.statusCode.should.equal(200);
            should.exist(b);
            should.exist(b.length);
            b.length.should.equal(1);
            validateMessages(b);
            request({
                uri: pot.resolve('apis', '/v/messages/' + b[0].id),
                method: 'GET',
                auth: {
                    bearer: client.users[0].token
                },
                json: true
            }, function (e, r, b) {
                if (e) {
                    return done(e);
                }
                r.statusCode.should.equal(200);
                should.exist(b);
                validateMessages([b]);
                request({
                    uri: pot.resolve('apis', '/v/messages/' + b.id),
                    method: 'GET',
                    auth: {
                        bearer: client.users[2].token
                    },
                    json: true
                }, function (e, r, b) {
                    if (e) {
                        return done(e);
                    }
                    r.statusCode.should.equal(200);
                    should.exist(b);
                    validateMessages([b]);
                    done();
                });
            });
        });
    });

    it('others cannot access', function (done) {
        request({
            uri: pot.resolve('apis', '/v/messages'),
            method: 'GET',
            auth: {
                bearer: client.users[0].token
            },
            json: true
        }, function (e, r, b) {
            if (e) {
                return done(e);
            }
            r.statusCode.should.equal(200);
            should.exist(b);
            should.exist(b.length);
            b.length.should.equal(1);
            validateMessages(b);
            request({
                uri: pot.resolve('apis', '/v/messages/' + b[0].id),
                method: 'GET',
                auth: {
                    bearer: client.users[1].token
                },
                json: true
            }, function (e, r, b) {
                if (e) {
                    return done(e);
                }
                r.statusCode.should.equal(errors.notFound().status);
                should.exist(b);
                should.exist(b.code);
                should.exist(b.message);
                b.code.should.equal(errors.notFound().data.code);
                done();
            });
        });
    });

    it('can be accessed by the receiver', function (done) {
        request({
            uri: pot.resolve('apis', '/v/messages'),
            method: 'GET',
            auth: {
                bearer: client.users[0].token
            },
            json: true
        }, function (e, r, b) {
            if (e) {
                return done(e);
            }
            r.statusCode.should.equal(200);
            should.exist(b);
            should.exist(b.length);
            b.length.should.equal(1);
            validateMessages(b);
            var message = b[0];
            request({
                uri: pot.resolve('apis', '/v/messages/' + message.id),
                method: 'GET',
                auth: {
                    bearer: client.users[1].token
                },
                json: true
            }, function (e, r, b) {
                if (e) {
                    return done(e);
                }
                r.statusCode.should.equal(errors.notFound().status);
                should.exist(b);
                should.exist(b.code);
                should.exist(b.message);
                b.code.should.equal(errors.notFound().data.code);
                request({
                    uri: pot.resolve('apis', '/v/messages/' + message.id),
                    method: 'GET',
                    auth: {
                        bearer: client.users[2].token
                    },
                    json: true
                }, function (e, r, b) {
                    if (e) {
                        return done(e);
                    }
                    r.statusCode.should.equal(200);
                    should.exist(b);
                    validateMessages([b]);
                    request({
                        uri: pot.resolve('apis', '/v/messages/' + message.id),
                        method: 'POST',
                        auth: {
                            bearer: client.users[2].token
                        },
                        headers: {
                            'X-Action': 'transit'
                        },
                        json: {
                            action: 'receive'
                        }
                    }, function (e, r, b) {
                        if (e) {
                            return done(e);
                        }
                        r.statusCode.should.equal(204);
                        request({
                            uri: pot.resolve('apis', '/v/messages/' + message.id),
                            method: 'GET',
                            auth: {
                                bearer: client.users[0].token
                            },
                            json: true
                        }, function (e, r, b) {
                            if (e) {
                                return done(e);
                            }
                            r.statusCode.should.equal(200);
                            should.exist(b);
                            validateMessages([b]);
                            request({
                                uri: pot.resolve('apis', '/v/messages/' + message.id),
                                method: 'GET',
                                auth: {
                                    bearer: client.users[1].token
                                },
                                json: true
                            }, function (e, r, b) {
                                if (e) {
                                    return done(e);
                                }
                                r.statusCode.should.equal(errors.notFound().status);
                                should.exist(b);
                                should.exist(b.code);
                                should.exist(b.message);
                                b.code.should.equal(errors.notFound().data.code);
                                request({
                                    uri: pot.resolve('apis', '/v/messages/' + message.id),
                                    method: 'GET',
                                    auth: {
                                        bearer: client.users[2].token
                                    },
                                    json: true
                                }, function (e, r, b) {
                                    if (e) {
                                        return done(e);
                                    }
                                    r.statusCode.should.equal(200);
                                    should.exist(b);
                                    validateMessages([b]);
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
