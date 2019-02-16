const parseCookies = (req, res, next) => {
  if (req.headers.cookie === undefined) {
    req.cookies = {};
  } else {
    var resObj = {};
    var splitCookie = req.headers.cookie.split('; '); 
    for (var i = 0; i < splitCookie.length; i++) {
      var innerSplit = splitCookie[i].split('=');
      resObj[innerSplit[0]] = innerSplit[1];
    }
    req.cookies = resObj; 
  }
  next();
};

module.exports = parseCookies;