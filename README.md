baucis v0.4.0-1
===============

Baucis is Express middleware that creates configurable REST APIs using Mongoose schemata.

Like Baucis and Philemon of old, this library provides REST to the weary traveler.  The goal is to create a JSON REST API for Mongoose & Express that matches as closely as possible the richness and versatility of the [HTTP 1.1 protocol](http://www.w3.org/Protocols/rfc2616/rfc2616.html).

Those versions published to npm represent release versions.  Those versions not published to npm are development releases.

Relase versions of baucis can be considered stable.  Baucis uses [semver](http://semver.org).

Please report issues on GitHub if bugs are encountered.

![David Rjckaert III - Philemon and Baucis Giving Hospitality to Jupiter and Mercury](http://github.com/wprl/baucis/raw/master/david_rijckaert_iii-philemon_and_baucis.jpg "Hermes is like: 'Hey Baucis, don't kill that goose.  And thanks for the REST.'")

*David Rijckaert - Philemon and Baucis Giving Hospitality to Jupiter and Mercury*

Usage
-----

To install:

    npm install baucis

An example of creating a REST API from a couple Mongoose schemata:

    var Vegetable = new mongoose.Schema({
      name: String
    });

    var Fruit = new mongoose.Schema({
      name: String
    });

    // Note that Mongoose middleware will be executed as usual
    Vegetable.pre('save', function () { ... });

    // Register the schemata
    mongoose.model('vegetable', Vegetable);
    mongoose.model('fruit', Fruit);

    // Create the API routes
    baucis.rest({
      singular: 'vegetable',
    });

    baucis.rest({
      singular: 'fruit'
    });

    // Create the app and listen for API requests
    var app = express();
    app.use('/api/v1', baucis());
    app.listen(80);

Later, make requests:

 * GET /api/v1/vegetables/:id &mdash; get the addressed document
 * PUT /api/v1/vegetables/:id &mdash; create or update the addressed document
 * DEL /api/v1/vegetables/:id &mdash; delete the addressed object

 * GET /api/v1/vegetables &mdash; get all documents
 * POST /api/v1/vegetables &mdash; creates a new document and sends back its ID
 * PUT /api/v1/vegetables &mdash; replace all documents with given new documents
 * DEL /api/v1/vegetables &mdash; delete all documents

Examples
--------

Examples with jQuery:

    $.getJSON('/api/v1/vegetables/4f4028e6e5139bf4e472cca1', function (data) {
      console.log(data);
    });

    $.ajax({
      type: 'POST',
      dataType: 'json',
      url: '/api/v1/vegetables',
      data: {
        name: 'carrot',
        color: 'orange'
      }
    }).done(function (vegetable) {
      // The new document that was just created
      console.dir(vegetable);
    });

Requests to the collection (not its members) take standard MongoDB query parameters to filter the documents based on custom criteria.

    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: '/api/v1/vegetables',
      data: {
        conditions: JSON.stringify({
          color: 'red',
          'nutrition.sodium': { $lte: 10 }
        })
      }
    }).done(function (vegetables) {
      console.dir(vegetables);
    });

Examples with Backbone:

    var Vegetables = Backbone.Collection.extend({
      url: '/vegetables',
      baucis: function (options) {
        if (!options) return this.fetch();

        var data = {};

        Object.keys(options).forEach(function (key) {
          data[key] = JSON.stringify(options[key])
        });

        return this.fetch({ data: data });
      }
    });

    var Vegetable = Backbone.Model.extend({
      urlRoot: '/vegetables'
    });

    var vegetables = new Vegetables();
    vegetables.baucis({ conditions: { color: 'red' } }).then( ... );

Besides, the `conditions` option, `populate` is also currently
supported, to allow population of references to other documents.

    vegetables.baucis({
      conditions: { color: red },
      populate: 'child'
    });

    // or

    populate: ['child1', 'child2' ]

    // or

    populate: [{
      path: 'child1',
      select: ['fieldA', 'fieldB'],
      match: {
        'foo': { $gte: 7 }
      },
      options: { limit: 1 }
    }, ... ]

It is not permitted to use the `select` option of `populate` with a `+path`.  This allows you to deselect paths at the schema level using `select: false` in the path definition.  The client will not be able to select paths deselected in this way, but your server middleware may select these fields as usual using `query.select`.

See the Mongoose [population documentation](http://mongoosejs.com/docs/populate.html) for more information.

`skip` and `limit` are available as well, typically used for paging:

    vegetables.baucis({
      skip: 20,
      limit: 10
    });

`bacuis.rest`
-------------

Use plain old Connect/Express middleware, including pre-existing modules like `passport`.  For example, set the `all` option to add middleware to be called before all the model's API routes.

    baucis.rest({
      singular: 'vegetable',
      all: function (request, response, next) {
        if (request.isAuthenticated()) return next();
        return response.send(401);
      }
    });

Or, set some middleware for specific HTTP verbs or disable verbs completely:

    baucis.rest({
      singular: 'vegetable',
      get: [middleware1, middleware2],
      post: middleware3,
      del: false,
      put: false
    });

RESTful Headers
---------------

 * `Accept: application/json` is set for all responses.
 * The `Allow` header is set automatically, correctly removing HTTP verbs when
   those verbs have been disabled with e.g. `put: false`.
 * The `Location` HTTP header is set for PUT and POST responses.
 * If `relations: true` is passed to `baucis.rest`, the HTTP `Link` header will be set with various links for all responses.

Controllers
-----------

`baucis.rest` returns an instance of the controller created to handle the schema's API routes.

    var subcontroller = baucis.rest({
      singular: 'bar',
      basePath: '/:fooId/bars'
      publish: false, // don't add API routes automatically
      select: 'foo +bar -password' // select fields for all queries
      restrict: function (query, request) {
        // Only retrieve bars that are children of the given foo
        query.where('parent', request.params.fooId);
      }
    });

    var controller = baucis.rest({
      singular: 'foo',
      configure: function (controller) {
        // Embed the subcontroller at /foos/:fooId/bars
        controller.use(subcontroller);

        // Embed arbitrary middleware at /foos/qux
        controller.use('/qux', function (request, response, next) {
          // Do something cool…
          next();
        });
      }
    });

Controllers are Express apps, so do whatever you want with them.

    var controller = baucis.rest({
      singular: 'robot',
      configure: function (controller) {
        // Add middleware before all other rotues in the controller
        controller.use(express.cookieParser());
      }
    });

    // Add middleware after default controller routes
    controller.use(function () { ... });
    controller.set('some option name', 'value');
    controller.listen(3000);

Baucis uses the power of Express, without getting in its way.  It's meant to be a way to organize your REST API's Express middleware.

Contact Info
------------

 * http://kun.io/
 * @wprl

&copy; 2012-2013 William P. Riley-Land
