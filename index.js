var fs = require('fs')
var Promise = require('promise');
var cheerio = require('cheerio');
var gcloud = require('google-cloud');
var languageClient = gcloud.language({
  projectId: 'in-full-gear',
  keyFilename: __dirname + '/secret/auth_key.json'
});

var filepath = __dirname + '/data/october2016.html';
var outputFilepath = __dirname + "/data/output.json";


function getParserPromise(row){
  return new Promise(function (resolve, reject){
    var headerElem = row.find('span.c00');
    if(headerElem.length){
      var headerText = headerElem.text();
      if(headerText && headerText.length){
        /*return setTimeout(function(){
          resolve({
            text : headerText
          })
        }, 300);*/
        var doc = languageClient.document(headerText);
        return doc.detectEntities(function(err, entities){
          if(err) return resolve(null);
          resolve({
            url : "https://news.ycombinator.com/" + row.find('span.age a').attr('href'),
            entities : entities,
            text : headerText
          });
        });
      }
    }
    resolve(null);
  });
}

fs.readFile(filepath, function (err,data) {
  if (err) {
    return console.log(err);
  }
  var $ = cheerio.load(data);
  var rows = $('img[src="s.gif"][width="0"]').parent('td').parent('tr');
  var promises = [];
  rows.each(function(){
    promises.push(getParserPromise($(this)));
  });
  Promise.all(promises).then(function(records){
    var filteredRecords = records.filter(item=>item!==null);
    fs.writeFile(outputFilepath, JSON.stringify(filteredRecords), function (err) {
      if (err) return console.log("error writing output file :  %s", err);
      console.log('completed %s records!', filteredRecords.length);
    });
  });
});
