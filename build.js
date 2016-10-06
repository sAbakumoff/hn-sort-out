var fs = require("fs");
var Promise = require("promise");
var request = require("request");
var readFile = Promise.denodeify(require('fs').readFile);
var writeFile = Promise.denodeify(require('fs').writeFile);
const util = require('util');

var getRequest = function(url){
  return new Promise(function(resolve, reject){
    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        return resolve(body);
      }
      return reject(error);
    })
  })
}
var mapsApiKey = process.env.MAPS_API_KEY1;
var geoLocate = address => (getRequest(util.format("https://maps.googleapis.com/maps/api/geocode/json?key=%s&address=%s", mapsApiKey, address)));

var data = require(__dirname + "/data/10.16/data.json");
var places = {};
data.forEach(function(dataItem){
  if(dataItem.places){
    dataItem.places.forEach(function(place){
      if(!places.hasOwnProperty(place)){
        places[place] = [];
      }
      places[place].push([dataItem.id, dataItem.header]); // these are data for the google table
    })
  }
});

var templateFilepath = __dirname + "/index_template.html";
var compiledFilePath = __dirname + "/10.16.html";

var maxAddresses = 400; // max that Google Maps Can Display
var googleVisData = [];
var addresses = Object.keys(places);
Promise.resolve(0).then(function traverse(index){
  if(index === maxAddresses)
    return Promise.resolve(googleVisData);
  var address = addresses[index];
  console.log("resolving %s location...", address);
  return geoLocate(address).then(function (response){
    var location = JSON.parse(response);
    if(location && location.results && location.results.length){
      var geom = location.results[0].geometry;
      googleVisData.push([geom.location.lat, geom.location.lng, address, places[address]]);
    }
    return traverse(index + 1);
  }, function(err){
    console.log("error %s of geoLocate %s", err, address);
    return traverse(index + 1);
  });
})
.then(function dataReady(){
  return readFile(templateFilepath, "utf-8");
}, console.log)
.then(function fileRead(templateHtml){
  return templateHtml.replace("${map_data}", JSON.stringify(googleVisData))
  .replace("${time}", "October 2016")
  .replace("${mapsApiKey}", mapsApiKey);
}, console.log)
.then(function htmlReady(compiledHtml){
    return writeFile(compiledFilePath, compiledHtml);
})
.then(function fileSaved(){
  console.log('task is completed');
}, console.log);
