const models = require('../models');
const Promise = require('bluebird');
const Sessions = require('../models/session');

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

module.exports.createSession = (req, res, next) => {
  req.session = {};
  res.cookies = {};
  if (JSON.stringify(req.cookies) === JSON.stringify({})) {
    Sessions.create().then(function (results) {
      Sessions.get({id: results.insertId}).then(function(results) {
        req.session.hash = results.hash;
        res.cookies.shortlyid = {value: results.hash};   
        next();
      });
    });
  } else {
    Sessions.get({hash: req.cookies.shortlyid}).then(function(results) {

      if (results) {
        req.session.hash = req.cookies.shortlyid;

        if (results.user) {
          req.session.user = {username: results.user.username};
          req.session.userId = results.user.id;
        }
        next();
      } else {
        Sessions.create().then(function (results) {
          Sessions.get({id: results.insertId}).then(function(results) {
            req.session.hash = results.hash;
            res.cookies.shortlyid = {value: results.hash};   
            next();
          });
        });   
      }  
    });
  }
};
