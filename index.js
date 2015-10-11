'use strict';
var _ = require('lodash');
var express = require('express');

function MockServer(options) {
  var app = express();

  this.options = {
    data: './fileTree.json',
    port: 3000
  };
  _.assign(this.options, options || {});

  var fileTree = require(this.options.data);

  app.get(["/folder", "/folder*"], function (req, res) {
    var pathSegments = extractPathSegments(req);
    var folder = findFile(pathSegments);
    folder.items = _.map(folder.items, function (element) {
      element.items = undefined;
      var folderPath = _.clone(pathSegments);
      folderPath.push(element.title);
      return setPath(element, folderPath);
    });
    res.send(JSON.stringify(folder));
  });

  app.get(["/file", "/file*"], function (req, res) {
    var pathSegments = extractPathSegments(req);
    var fileDetails = findFile(pathSegments);
    fileDetails.items = undefined;
    res.send(JSON.stringify(fileDetails));
  });

  function findFile(pathSegments) {
    return setPath(
      _.cloneDeep(
        _.reduce(pathSegments, function (file, segment) {
          return _.find(_.result(file, 'items'), 'title', segment);
        }, {items: fileTree})
      ),
      pathSegments
    );
  }

  function extractPathSegments(req) {
    var pathSegments = decodeURI(req.originalUrl).substring(1).split('/');
    return _.filter(_.drop(pathSegments, 1), function (segment) {
      return segment.length > 0;
    });
  }

  function setPath(document, pathSegments) {
    document.path = encodeURI('/' + pathSegments.join('/'));
    return document;
  }

  app.put(["/file", "/file*"], function (req, res) {
    res.send("ok");
  });

  var server = app.listen(this.options.port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Mock data server is listening at http://%s:%s', host, port);
  });

  this.close = function () {
    server.close();
  }
}

module.exports = {
  start: function (options) {
    return new MockServer(options);
  }
};

