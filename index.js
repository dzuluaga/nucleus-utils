"use strict";
var _ = require('lodash');
var debug = require('debug')('nucleus-utils');
var Sequelize = require('sequelize');
var options;
var db_connections;

module.exports = function initializer( _options ){
  function getEnvironment() {
    return process.env.NODE_ENV || config_all_envs.default_environment;
  }
  function getConfig() {
    return config;
  }
  /* if limitVal undefined, then use default_pagination,
   else if limitVal is less or equal to 0, return 1
   else use default_pagination if limitVal is greater than that*/
  function getLimit(limitVal) {
    var limit = Math.min(Math.max(limitVal, 1) || config.default_pagination, config.default_pagination);
    return limit;
  }
  if( _options && !options) {
    debug('initializing nucleus-utils');
    var config_all_envs = _options.config;
    var config = _options.config[getEnvironment()];
    initDatabases( { configs : [ config.database, config.database_security ], all_config: config_all_envs } )
    options = _options;
    module.exports = {
      getIncludes: getIncludes,
      tryToParseJSON: tryToParseJSON,
      sendError: sendError,
      getEnvironment: getEnvironment,
      getLimit: getLimit,
      getConfig: getConfig,
      initDatabases: initDatabases,
      db_connections: db_connections
    }
    return module.exports;
  } else if( options ){
    throw new Error('nucleus-utils already initialized.');
  }
}
function findModel(models, includeAlias) {
  var _model;
  var model = Object.keys(models).find(function (key) {
    if (models[key].includeAlias === includeAlias) {
      _model = models[key]
      return true;
    }
  });
  if (!_model) throw new Error('Invalid include entity.');
  return _model;
}

// Attempt to parse JSON
// If the parse fails, return the error object
// If JSON is falsey, return null
// (this is so that it will be ignored if not specified)
function tryToParseJSON(json, errorMessage, defaultValue) {
  if (!_.isString(json)) return defaultValue;
  try {
    return JSON.parse(json);
  }
  catch (e) {
    var error = new SyntaxError(errorMessage);
    error.code = 400;
    throw error;
  }
}

function sendError(code, err, req, res) {
  //var er = { code: code, message: err.message, error: err, stack: req.query.stacktrace === 'true' ? ( err.stack || null ) : null };
  var er;
  if (req.query.stacktrace === 'true') {//show stacktrace only when requested
    er = {code: code, message: err.message, error: err, stacktrace: err.stack};
  }
  else {
    er = {code: code, message: err.message, error: err, stacktrace: null};
  }
  res.status(code).json(er);
}

function initDatabases(_options) {
  debug("initializing database connections");
  if (_options && !db_connections) {
    db_connections = {};
    options = _options;
    options.configs.forEach(function (config) {
      if (!config.name) {
        throw new Error('Name attribute is missing from database config entry. Check config.json file');
      }
      db_connections[config.name] = new Sequelize(config.database, config.username, config.password || process.env.nucleus_password, config);
      //var sequelize = new Sequelize(config.database, config.username, config.password || process.env.nucleus_password, config);
      db_connections[config.name]._all_config = _options.all_config;
      db_connections[config.name].authenticate().then(function (errors) {
        if (errors) {
          console.log("nucleus ", config.name, "DB ", errors)
        } else {
          console.log("connection to ", config.name, " successful");
        }
      });
    });
  }
  return db_connections;
}
function getIncludes(models, includes) {
  var include_child = [];
  if (!models) throw new Error('Set models for this controller.');
  var models = models || {};
  var include_param = tryToParseJSON(includes, 'Cannot parse include parameter.', []) /*JSON.parse( includes )*/;
  include_param.forEach(function (include) {
    var model = findModel(models, include.name.toUpperCase()); //models[ ModelMap[ include.name.toUpperCase() ] ];
    include_child.push({model: model, attributes: include.attributes || model.listAttributes, required: false});
  });
  return include_child;
}

//module.exports = initializer;