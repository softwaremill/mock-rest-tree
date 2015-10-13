var mockServer = require('../');
var should = require('should');
var request = require('supertest');

describe('Mock tree server', function () {

  describe('Options', function () {

    it('should run on a port specified by an option', function (done) {
      // given
      var server = mockServer.start({
        port: 9999,
        dataObject: {}
      });

      request("http://localhost:9999")
        .get('/node')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err) {
          if (err) throw err;
          server.close();
          done();
        });
    });

    it('should load a data from a file', function (done) {
      givenAServerWithOptions({
        data: './test/testData.json'
      })
        .whenDoingAGetRequestTo('/node')
        .then(function (body) {
          body.rootInFile.should.equal(true);
        }, done);
    });

    it('should serve data from data object', function (done) {
      givenAServerWithOptions({
        dataObject: {
          rootInObject: true
        }
      })
        .whenDoingAGetRequestTo('/node')
        .then(function (body) {
          body.rootInObject.should.equal(true);
        }, done);
    });

    it('should set node path', function (done) {
      givenAServerWithOptions({
        dataObject: {
          root: true
        },
        nodePath: '/myNode'
      })
        .whenDoingAGetRequestTo('/myNode')
        .then(function (body) {
          body.root.should.equal(true);
        }, done);
    });

    it('should set children path', function (done) {
      givenAServerWithOptions({
        dataObject: {
          children: [
            {
              root: false
            }
          ]
        },
        childrenPath: '/myChildren'
      })
        .whenDoingAGetRequestTo('/myChildren')
        .then(function (body) {
          body.children[0].root.should.equal(false);
        }, done);
    });

    it('should set id field name', function (done) {
      givenAServerWithOptions({
        dataObject: {
          children: [
            {
              name: 'newIdField'
            }
          ]
        },
        idFieldName: 'name'
      })
        .whenDoingAGetRequestTo('/node/newIdField')
        .then(function (body) {
          body.name.should.equal('newIdField');
        }, done);
    });

    it('should set children field name', function (done) {
      givenAServerWithOptions({
        dataObject: {
          items: [
            {
              id: 'someId',
              items: [
                {
                  id: 'otherId'
                }
              ]
            }
          ]
        },
        childrenFieldName: 'items'
      })
        .whenDoingAGetRequestTo('/children/someId')
        .then(function (body) {
          body.id.should.equal('someId');
          body.items[0].id.should.equal('otherId');
        }, done);
    });

    it('should include path if includePath option is set to true (default)', function (done) {
      givenAServerWithOptions({
        dataObject: {
          children: [
            {
              id: 'someId',
              children: [
                {
                  id: 'otherId'
                }
              ]
            }
          ]
        }
      })
        .whenDoingAGetRequestTo('/children/someId')
        .then(function (body) {
          body.path.should.equal('/someId');
          body.children[0].path.should.equal('/someId/otherId');
        }, done);
    });

    it('should not include path if includePath option is set to false', function (done) {
      givenAServerWithOptions({
        dataObject: {
          children: [
            {
              id: 'someId',
              children: [
                {
                  id: 'otherId'
                }
              ]
            }
          ]
        },
        includePath: false
      })
        .whenDoingAGetRequestTo('/children/someId')
        .then(function (body) {
          should(body.path).not.be.ok();
          should(body.children[0].path).not.be.ok();
        }, done);
    });

  });

  describe('Node resource', function () {

    it('should get a root object', function (done) {
      givenAServerWithOptions({
        dataObject: {
          root: true
        }
      })
        .whenDoingAGetRequestTo('/node')
        .then(function (body) {
          body.root.should.equal(true);
        }, done);
    });

    it('should remove children from root object', function (done) {
      givenAServerWithOptions({
        dataObject: {
          root: true,
          children: [
            {
              root: false
            }
          ]
        }
      })
        .whenDoingAGetRequestTo('/node')
        .then(function (body) {
          body.root.should.equal(true);
          should(body.children).not.be.ok();
        }, done);
    });

    it('should add path to the root object', function (done) {
      givenAServerWithOptions({
        dataObject: {}
      })
        .whenDoingAGetRequestTo('/node')
        .then(function (body) {
          body.path.should.equal('/');
        }, done);
    });

    it('should find one of children nodes', function (done) {
      givenAServerWithOptions({
        dataObject: {
          children: [
            {
              id: 'child1'
            }
          ]
        }
      })
        .whenDoingAGetRequestTo('/node/child1')
        .then(function (body) {
          body.id.should.equal('child1');
          body.path.should.equal('/child1');
        }, done);
    });

    it('should find a deep child', function (done) {
      givenAServerWithOptions({
        dataObject: {
          children: [
            {
              id: 'child1',
              children: [
                {
                  id: 'child2',
                  children: [
                    {
                      id: 'child3'
                    }
                  ]
                }
              ]
            }
          ]
        }
      })
        .whenDoingAGetRequestTo('/node/child1/child2/child3')
        .then(function (body) {
          body.id.should.equal('child3');
          body.path.should.equal('/child1/child2/child3');
        }, done);
    });
  });

  describe('Children resource', function () {

    it('should get all the children of root object', function (done) {
      givenAServerWithOptions({
        dataObject: {
          children: [
            {
              child: true
            },
            {
              child: true
            }
          ]
        }
      })
        .whenDoingAGetRequestTo('/children')
        .then(function (body) {
          body.children.should.have.length(2);
        }, done);
    });

    it('should remove children of all its children', function (done) {
      givenAServerWithOptions({
        dataObject: {
          children: [
            {
              children: [{}]
            },
            {
              children: [{}]
            }
          ]
        }
      })
        .whenDoingAGetRequestTo('/children')
        .then(function (body) {
          should(body.children[0].children).not.be.ok();
          should(body.children[1].children).not.be.ok();
        }, done);
    });

    it('should add paths to all its children', function (done) {
      givenAServerWithOptions({
        dataObject: {
          children: [
            {
              id: '1'
            },
            {
              id: '2'
            }
          ]
        }
      })
        .whenDoingAGetRequestTo('/children')
        .then(function (body) {
          body.children[0].path.should.equal('/1');
          body.children[1].path.should.equal('/2');
        }, done);
    });

    it('should list children of a child', function (done) {
      givenAServerWithOptions({
        dataObject: {
          children: [
            {
              id: '1',
              children: [
                {
                  id: '2',
                  children: [
                    {
                      id: '3'
                    }
                  ]
                }
              ]
            }
          ]
        }
      })
        .whenDoingAGetRequestTo('/children/1/2')
        .then(function (body) {
          body.id.should.equal('2');
          body.path.should.equal('/1/2');
          body.children[0].id.should.equal('3');
          body.children[0].path.should.equal('/1/2/3');
        }, done);
    });

  });

  function givenAServerWithOptions(options) {
    var server = mockServer.start(options);
    var currentRequest;

    return {
      whenDoingAGetRequestTo: function (path) {
        currentRequest = request("http://localhost:3000")
          .get(path)
          .expect('Content-Type', /json/)
          .expect(200);

        return {
          then: function (expectations, done) {
            currentRequest.end(function (err, res) {
              if (err) throw err;

              expectations(res.body);

              server.close();
              done();
            });
          }
        };
      }
    };
  }
});