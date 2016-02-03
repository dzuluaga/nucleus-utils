"use strict";
var _ = require('lodash');

function initializer( options ){
  var config_all_envs = options.config;
  var config = options.config[ getEnvironment() ];
  function getIncludes( models, includes ){
    var include_child = [];
    if( !models ) throw new Error('Set models for this controller.');
    var models = models || {};
    var include_param = tryToParseJSON( includes, 'Cannot parse include parameter.', [] ) /*JSON.parse( includes )*/;
    include_param.forEach( function( include ) {
      var model = findModel( models, include.name.toUpperCase() ); //models[ ModelMap[ include.name.toUpperCase() ] ];
      include_child.push( { model: model, attributes: include.attributes || model.listAttributes, required: false } );
    });
    return include_child;
  }

  function findModel( models, includeAlias ) {
    var _model;
    var model = Object.keys( models ).find(function( key ) {
      if( models[ key ].includeAlias === includeAlias ){
        _model = models[ key ]
        return true;
      }
    });
    if( !_model ) throw new Error('Invalid include entity.');
    return _model;
  }

  // Attempt to parse JSON
  // If the parse fails, return the error object
  // If JSON is falsey, return null
  // (this is so that it will be ignored if not specified)
  function tryToParseJSON (json, errorMessage, defaultValue) {
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

  function sendError( code, err, req, res ) {
    //var er = { code: code, message: err.message, error: err, stack: req.query.stacktrace === 'true' ? ( err.stack || null ) : null };
    var er;
    if( req.query.stacktrace === 'true' ) {//show stacktrace only when requested
      er = {code: code, message: err.message, error: err, stacktrace: err.stack};
    }
    else {
      er = {code: code, message: err.message, error: err, stacktrace: null};
    }
    res.status( code ).json( er );
  }

  function getEnvironment(){
    return process.env.NODE_ENV || config_all_envs.default_environment;
  }

  function getConfig(){
    return config;
  }

  /* if limitVal undefined, then use default_pagination,
   else if limitVal is less or equal to 0, return 1
   else use default_pagination if limitVal is greater than that*/
  function getLimit( limitVal ){
    var limit = Math.min( Math.max ( limitVal, 1 ) || config.default_pagination, config.default_pagination );
    return limit;
  }

  return {
      getIncludes : getIncludes,
      tryToParseJSON: tryToParseJSON,
      sendError: sendError,
      getEnvironment: getEnvironment,
      getLimit: getLimit,
      getConfig: getConfig,
    }
}
module.exports = initializer;

/*
 function getModels() {
 return require('../models');
 }
 */

//getModels: getModels

/*
 switch( include.name.toUpperCase() ){
 case "CASES":
 include_child.push( {
 model: models.Case, attributes: include.attributes ||  models.Case.listAttributes, required: false,
 }); //add CASES with attributes to include
 break;
 case "OPPORTUNITIES":
 include_child.push( {
 model: models.Opportunity, attributes: include.attributes ||  models.Opportunity.listAttributes, required: false,
 }); //add OPPORTUNITIES with attributes to include
 break;
 case "CONTACTS":
 include_child.push( {
 model: models.Contact, attributes: include.attributes ||  models.Contact.listAttributes, required: false,
 }); //add CONTACTS with attributes to include
 break;
 case "QCRS":
 include_child.push( {
 model: models.Qcr, attributes: include.attributes ||  models.Qcr.listAttributes, required: false,
 }); //add QCRs with attributes to include
 break;
 case "SFDCUSERS":
 include_child.push( {
 model: models.SfdcUser, attributes: include.attributes ||  models.SfdcUser.listAttributes, required: false,
 }); //add QCRs with attributes to include
 break;
 case "CASECOMMENTS":
 include_child.push( {
 model: models.CaseComment, attributes: include.attributes ||  models.CaseComment.listAttributes, required: false,
 }); //add CASE_COMMENT with attributes
 break;
 case "CUSTOMERS":
 include_child.push( {
 model: models.Customer, attributes: include.attributes ||  models.Customer.listAttributes, required: false,
 });
 break;
 case "ACCOUNTS":
 include_child.push( {
 model: models.Account, attributes: include.attributes ||  models.Account.listAttributes, required: false,
 });
 break;
 case "APIS":
 console.log( models )
 include_child.push( {
 model: models.OrgApi, attributes: include.attributes ||  models.OrgApi.listAttributes, required: false,
 });
 break;
 case "ORGAPIREVISIONVERSIONS":
 include_child.push( {
 model: models.OrgApiRevisionVersion, attributes: include.attributes ||  models.OrgApiRevisionVersion.listAttributes, required: false,
 });
 break;

 default:
 var error = new SyntaxError("Invalid include parameter.");
 error.code = 400;
 throw error;
 break;
 }*/