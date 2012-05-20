var messages = require('./messages');
var utils = require('./lib/utils');
var accounts9 = require('./lib/accounts9');
var userman = require('./userman.js');
var async = require('async');

exports.displayUser = function displayUser(req, res) {
  var username = req.params.name;
  var user;
  async.waterfall([
    function(callback) {
      //Fetch user infomation
      userman.getUser({username: username}, callback);
    },
    function(theUser, callback) {
      if (theUser == null) {
        callback('no-such-user');
        return;
      }
      user = theUser;
      //Fetch domains belong to the user
      userman.getDomains({username: username}, callback);
    },
  ], function(err, domains) {
    if (err) {
      req.flash('error', err);
      res.redirect('/');
      return;
    }
    res.render('user', {
      locals: {
        title: messages.get('user'),
        returnto: req.query.returnto,
        userinfo: user.net9,
        domains: domains,
      },
    });
  });
};

exports.logout = function logout(req, res) {
  var redirectURL = req.query.returnto || '/';
  req.session.username = null;
  res.redirect(redirectURL);
};

exports.login = function login(req, res) {
  var callbackUri = utils.getSiteUrl(req) + '/auth_callback';
  
  var redirectUri = accounts9.getAuthorizeUrl(callbackUri);
  res.redirect(redirectUri);
};

exports.authCallback = function authCallback(req, res) {
  function authError(error) {
    req.flash('error', error);
    res.redirect('/');
  };

  error = req.param('error');
  code = req.param('code');
  if (error !== undefined || code === undefined) {
    return authError(error);
  }
  
  var callbackUri = utils.getSiteUrl(req) + '/auth_callback';
  accounts9.getOAuthAccessToken(code, callbackUri, function(err, access_token, refresh_token) {
    if (err) {
      return authError(err);
    }
    accounts9.getUser(function(err, user) {
      if (err) {
        return authError(err);
      }
      var username = user.name;

      userman.updateNet9(user, function(err) {
        if (err) {
          return on_error(err);
        }
        req.session.username = username;
        res.redirect('/' + username);
      });
    });
  });
};

exports.checkLogin = function regDomain(req, res, next) {
  if (req.session.username) {
    next();
  } else {
    req.flash('error', 'not-login');
    res.redirect('/');
  }
};

exports.regDomain = function regDomain(req, res) {
  var domainName = req.params.name;
  if (domainName) {
    userman.getDomains({name: domainName}, function(err, domains) {
      if (err || domains.length !== 1) {
        req.flash('error', 'no-such-domain');
        res.redirect('/' + req.session.username);
      } else {
        var domain = domains[0];
        res.render('regdomain', {
          locals: {
            title: messages.get('edit-domain-information'),
            username: req.session.username,
            domain: domain,
            returnto: req.query.returnto,
          },
        });
      }
    });
  } else {
    res.render('regdomain', {
      locals: {
        title: messages.get('register-new-domain'),
        username: req.session.username,
        domain: null,
        returnto: req.query.returnto,
      },
    });
  }
};

exports.regDomainDo = function regDomain(req, res) {
  userman.regDomain({
    username: req.session.username,
    name: req.body.name,
    ip: req.body.ip,
    desc: req.body.desc,
  }, function(err) {
    if (err) {
      req.flash('error', err);
    }
    res.redirect('/' + req.session.username);
  });
};
