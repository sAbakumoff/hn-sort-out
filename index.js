var fs = require("fs")
var Promise = require("promise");
var cheerio = require("cheerio");
var gcloud = require("google-cloud");
var languageClient = gcloud.language({
  projectId: "in-full-gear",
  keyFilename: __dirname + "/secret/auth_key.json"
});

var filepath = __dirname + "/data/10.16/source.html";

if(process.env.NODE_ENV==="DEBUG"){
  outputFilepath = __dirname + "/data/10.16/data_debug.json";
}
else{
  var outputFilepath = __dirname + "/data/10.16/data.json";
}

var getContentsPath = id=>__dirname + "/data/10.16/contents/"+id;


function getEntities(row){
  console.log("get entities of record %s ...", row.id);
  return new Promise(function (resolve, reject){
    if(process.env.NODE_ENV==="DEBUG"){
      return resolve(row);
    }
    var doc = languageClient.document({content : row.content, type:"html"});
    return doc.detectEntities({verbose : false},function(err, entities){
      if(err){
        console.log("error %s on detecting entities", err);
        return resolve(null);
      }
      resolve(Object.assign({}, row, {places : entities.places}))
    });
  });
}

function writeContent(record){
  return new Promise(function (resolve, reject){
    if(record && record.content && record.id){
      return fs.writeFile(getContentsPath(record.id), record.content, function(err){
        if(err) return reject(err);
        resolve(record);
      });
    }
    resolve(null);
  });
}

function writeHeaders(records){
  return new Promise(function (resolve, reject){
    fs.writeFile(outputFilepath, JSON.stringify(records), function (err) {
      if (err) return reject(err);
      resolve(records.length);
    });
  });
}

function onFailure(err){
  console.log("the error %s happened along the way", err);
  return Promise.reject(err);
}

function parseRow(row){
  var contentElem = row.find("span.c00");
  if(contentElem.length){
    var header = contentElem[0].children[0].data;
    var content = contentElem.html();
    if(content && content.length){
      return {
        header : header,
        id : row.attr("id"),
        content : content
      }
    }
  }
}

fs.readFile(filepath, function (err,data) {
  if (err) {
    return console.log(err);
  }
  var $ = cheerio.load(data);
  $("div.reply").remove();
  var rows = $('img[src="s.gif"][width="0"]').parents("tr[id]");
  var records = [];
  var maxRecords = 1000;

  Promise.resolve(0).then(function core(index){
    if(index === maxRecords)
      return Promise.resolve(records);
    var rowObj = parseRow($(rows[index]));
    if(rowObj){
      return getEntities(rowObj).then(function done(record){
        records.push(record);
        return core(index + 1);
      }, onFailure);
    }
    else{
      console.log("unformatted row found!");
    }
    return core(index + 1);
  }).then(function done(records){
    return Promise.all(records.map(record=>writeContent(record)));
  }, onFailure).then(function done(records){
    var writableRecords = records.filter(item=>item!==null)
    .map(record=>({id : record.id, header : record.header, places : record.places}));
    return writeHeaders(writableRecords);
  }, onFailure).then(function done(totalRecords){
    console.log("%s records processed", totalRecords);
  }, onFailure);
});
