var requireindex = require('requireindex');
var expect       = require('expect.js');
var request      = require('request');

var fixtures = requireindex('./test/fixtures');

describe('HEAD singular', function () {
  before(fixtures.vegetable.init);
  beforeEach(fixtures.vegetable.create);
  after(fixtures.vegetable.deinit);

  it('should get the header for the addressed document', function(done){
    var turnip = vegetables[0];
    var options = {
      url: 'http://localhost:8012/api/vegetable/' + turnip._id,
      json: true
    };
    request.head(options, function (error, response, body) {
      if (error) return done(error);
      expect(response).to.have.property('statusCode', 200);
      expect(body).to.be.empty();
      done();
    });
  });

  it('should return a 404 when ID not found', function (done) {
    var options = {
      url: 'http://localhost:8012/api/vegetable/666666666666666666666666',
      json: true
    };
    request.head(options, function (error, response, body) {
      if (error) return done(error);
      expect(response).to.have.property('statusCode', 404);
      expect(body).to.be.empty();
      done();
    });
  });

  it('should return a 500 when ID malformed (not ObjectID)', function (done) {
    var options = {
      url: 'http://localhost:8012/api/vegetable/6',
      json: true
    };
    request.head(options, function (error, response, body) {
      if (error) return done(error);
      expect(response).to.have.property('statusCode', 500);
      done();
    });
  });

});