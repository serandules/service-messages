var log = require('logger')('service-messages');
var bodyParser = require('body-parser');

var auth = require('auth');
var throttle = require('throttle');
var serandi = require('serandi');
var model = require('model');
var Messages = require('model-messages');

module.exports = function (router, done) {
    router.use(serandi.many);
    router.use(serandi.ctx);
    router.use(auth({
        GET: [
            '^\/$',
            '^\/.*'
        ],
        POST: [
          '^\/$'
        ]
    }));
    router.use(throttle.apis('messages'));
    router.use(bodyParser.json());

    router.post('/',
      serandi.json,
      serandi.create(Messages),
      function (req, res, next) {
        model.create(req.ctx, function (err, location) {
            if (err) {
                return next(err);
            }
            res.locate(location.id).status(201).send(location);
        });
    });

    router.post('/:id',
      serandi.id,
      serandi.json,
      serandi.transit({
          workflow: 'model-messages',
          model: Messages
      }));

    router.get('/:id',
      serandi.id,
      serandi.findOne(Messages),
      function (req, res, next) {
        model.findOne(req.ctx, function (err, location) {
            if (err) {
              return next(err);
            }
            res.send(location);
        });
    });

    router.put('/:id',
      serandi.id,
      serandi.json,
      serandi.update(Messages),
      function (req, res, next) {
        model.update(req.ctx, function (err, location) {
          if (err) {
            return next(err);
          }
          res.locate(location.id).status(200).send(location);
        });
    });

    router.get('/',
      serandi.find(Messages),
      function (req, res, next) {
        model.find(req.ctx, function (err, pages, paging) {
            if (err) {
                return next(err);
            }
            res.many(pages, paging);
        });
    });

    router.delete('/:id',
      serandi.id,
      serandi.remove(Messages),
      function (req, res, next) {
        model.remove(req.ctx, function (err) {
        if (err) {
          return next(err);
        }
        res.status(204).end();
      });
    });

    done();
};

