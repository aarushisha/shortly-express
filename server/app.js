const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const Users = require('./models/user');
const Sessions  = require('./models/session');
const CookieParser = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(CookieParser);
app.use(Auth.createSession);
app.use(express.static(path.join(__dirname, '../public')));


app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', (req, res) => {
  Users.create(req.body).then(function (results) {
    res.redirect('/');
    return results;
  }).then(function(results) {
    Sessions.update({hash: req.session.hash}, {userId: results.insertId});
  })
  .catch(function (err) {
    if (err.code = 'ER_DUP_ENTRY') {
      res.redirect('/signup');
    }
  });
});


app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  Users.get({ username: req.body.username }).then(function (results) {
    if (results === undefined) {
      res.redirect('/login');
    } else {
      if (Users.compare(req.body.password, results.password, results.salt)) {
        res.redirect('/');
      } else {
        res.redirect('/login');
      }
    }
  }).catch(function (err) {
    res.sendStatus(404);
  });
  // send a cookie to the client that state that the user is logged in.

});

app.get('/',
  (req, res) => {
    if (req.session.user === undefined) {
      res.redirect('/login');
    } else {
      res.render('index');
    }
  });

  app.get('/logout',
  (req, res) => {
    Sessions.delete({hash: req.session.hash}).then(function() {
      res.clearCookie('shortlyid');
    }).then(function() {
      res.redirect('/login');
    });
  });

app.get('/create',
  (req, res) => {
    if (req.session.user === undefined) {
      res.redirect('/login');
    } else {
      res.render('index');
    }
  });

app.get('/links',
  (req, res, next) => {
    if (req.session.user === undefined) {
      res.redirect('/login');
    }  else {
      models.Links.getAll()
        .then(links => {
          res.status(200).send(links);
        })
        .error(error => {
          res.status(500).send(error);
        });
    }
  });

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
