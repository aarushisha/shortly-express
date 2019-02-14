const parseCookies = (req, res, next) => {
  console.log('req in parseCookies-------', req);
  // console.log('req.headers in parseCookies--------', req.headers);
  // console.log(JSON.stringify(req.headers));
  //returns object that takes what is before the = and makes it the key and what is after becomes object
  //can handle more than one cookie?
  // console.log('if condition', JSON.stringify(req.headers) === JSON.stringify({}));
  if (JSON.stringify(req.headers) === JSON.stringify({})) {
    res.send({});
  } else {
    // console.log(req.headers.cookie.split(';'));
    var resObj = {};
    var splitCookie = req.headers.cookie.split(';');
    console.log(splitCookie);
    for (var i = 0; i < splitCookie.length; i++) {
      var innerSplit = splitCookie[i].split('=');
      resObj[innerSplit[0]] = innerSplit[1];
    }

    console.log(JSON.stringify(resObj));
    res.cookies = resObj;
    res.send(res.cookies);
  }
  
  next();
};

module.exports = parseCookies;