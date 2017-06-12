var express = require('express');
var router = express.Router();

var os = require('os');   
  var interfaces = os.networkInterfaces();
  var addresses = [];
  interfaceloop: for (var k in interfaces) {
      for (var k2 in interfaces[k]) {
          var address = interfaces[k][k2];
          if (address.family === 'IPv4' && !address.internal) {
              addresses.push(address.address);
              break interfaceloop;
          }        
      }
  }
  var host=String(addresses);
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('peer', { host: host });
});

module.exports = router;
