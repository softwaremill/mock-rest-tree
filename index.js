'use strict';
var _ = require('lodash');
var express = require('express');

function MockServer(options) {
  var app = express();
  var mockServer = this;

  mockServer.options = {
    // Path to JSON file containing mock server data
    data: './data.json',

    // HTTP path of resource containing single tree node
    elementPath: '/node',

    // HTTP path of resource containing tree node with it's immediate children
    collectionPath: '/children',

    // Name of JSON field which will be used for tree navigation
    // e.g. if idFieldName === 'id', /node/123 will retrieve
    // node with id field set to 123
    idFieldName: 'id',

    // Name of JSON field which will be used to get node's children
    // e.g. if childrenFieldName === 'children', /children will
    // return an empty root element, with all it's immediate children
    // stored in children field
    childrenFieldName: 'children',

    // If set to true, the server will automatically add path field to each
    // served element. The path field will contain values of fields named in
    // idFieldName from the root element up to served element i.e. for
    // /node/123/456, the path will be '/123/456'
    includePath: true,

    // The port on which the API will be served upon its start
    port: 3000
  };

  _.assign(mockServer.options, options || {});

  var data = mockServer.options.dataObject || require(mockServer.options.data);

  function handleCollectionRequest(req, res) {
    var pathSegments = extractPathSegments(req, mockServer.options.collectionPath);
    var node = findNode(pathSegments);
    node[mockServer.options.childrenFieldName] = _.map(node[mockServer.options.childrenFieldName], function (child) {
      child[mockServer.options.childrenFieldName] = undefined;
      return setPathIncludingElementIfEnabled(child, pathSegments);
    });
    res.send(JSON.stringify(node));
  }

  function handleElementRequest(req, res) {
    var pathSegments = extractPathSegments(req, mockServer.options.elementPath);
    var node = findNode(pathSegments);
    node[mockServer.options.childrenFieldName] = undefined;
    res.send(JSON.stringify(node));
  }

  function extractPathSegments(req, resourceRootPath) {
    var pathSegments = decodeURI(req.originalUrl).substring(resourceRootPath.length).split('/');
    return _.filter(pathSegments, function (segment) {
      return segment.length > 0;
    });
  }

  function findNode(pathSegments) {
    var initialObject = {};
    initialObject[mockServer.options.childrenFieldName] = data;
    var node = _.cloneDeep(
      _.reduce(pathSegments, function (node, segment) {
        return _.find(
          _.result(
            node,
            mockServer.options.childrenFieldName
          ),
          mockServer.options.idFieldName,
          segment
        );
      }, initialObject)
    );
    return setPathIfEnabled(node, pathSegments);
  }

  function setPathIncludingElementIfEnabled(element, pathSegments) {
    var path = _.clone(pathSegments);
    path.push(element.title);
    return setPathIfEnabled(element, path);
  }

  function setPathIfEnabled(element, pathSegments) {
    if(mockServer.options.includePath) {
      element.path = encodeURI('/' + pathSegments.join('/'));
    }
    return element;
  }

  app.get(
    [
      mockServer.options.collectionPath,
      mockServer.options.collectionPath + "*"
    ],
    handleCollectionRequest
  );

  app.get(
    [
      mockServer.options.elementPath,
      mockServer.options.elementPath + "*"
    ],
    handleElementRequest
  );

  var server = app.listen(mockServer.options.port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Mock data server is listening at http://%s:%s', host, port);
  });

  mockServer.close = function () {
    server.close();
  }
}

module.exports = {
  start: function (options) {
    return new MockServer(options);
  }
};

