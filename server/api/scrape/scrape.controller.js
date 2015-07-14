'use strict';

var _ = require('lodash');
var Scrape = require('./scrape.model');
var scraper = require('../.././components/scraper');
var sources = require('./sources');

exports.omdb = function(req, res){
    
    Scrape.find({}, function(err, results){
        
        if(err) { return handleError(res, err); }
        
        results.forEach(function(result, i){

            var newResult = result.toObject();
            
           if(!result.omdb || !result.omdb.imdbID){      
                         
               scraper.loadOmdbData(newResult, function(omdbResult){
                    
                    //omdbResult = omdbResult.toObject();
                    
                    var id = omdbResult._id;
                    delete omdbResult._id;
                       
                    console.log('changed?', omdbResult.imdbId);
                       
                    Scrape.update({_id: id}, omdbResult, {}, function(error, saveResult){
                        
                        if(error) { return handleError(res, error); }
                        
                        console.log('saved', i + ' vs ' + results.length);
                        
                        if(i == (results.length - 1)){
                            console.log('last one...');
                            //res.send('Done! ' + i + ' records.');
                        }
                        
                    });
                                       
               })
           }
        });
        
    })
    
}

exports.scrape = function(req, res){

    scraper.load(sources)
        .then(saveSources);
        
     res.send('its cool. we got this.');   
    function saveSources(data){
        Scrape.remove({}, function(err) { 
           console.log('collection removed') 
           
            Scrape.create(data, function(err, result){
    
                if(err){console.log('an error occured saving the data', err)}
    
                //res.json(200, data);
    
            });
        
        
        });


    }
    
};

// Get list of scrapes
exports.index = function(req, res) {
  
    var paginate = {
        skip: req.query.skip || undefined,
        limit: req.query.limit || undefined  
    };
    
    var search = {
        active: true
    };
    
    var sort = '';
    
  if(req.query.search){
      
    search.name = { 
        "$regex": req.query.search, 
        "$options": "i" 
    }
      
  }
  
  if(req.query.mediaType){
    var types = req.query.mediaType.split(','),
        typeQuery = {'$or':[]};
    search['$and'] = search['$and'] || [];
    types.forEach(function(type){
        typeQuery['$or'].push({'type': type});
    });  
    search['$and'].push(typeQuery);  
      
  }

  
  if(req.query.source){
    
    var sources = req.query.source.split(','),
        sourceQuery = {'$or':[]}; 
   
    search['$and'] = search['$and'] || [];
    
    sources.forEach(function(source){
        sourceQuery['$or'].push({'sourceNames':source});
    })
    
    search['$and'].push(sourceQuery);

  }
    
  if(req.query.sortBy){
      
    var sortingMethods = [
        'name',
        '-name',
        {'imdbRating': -1},
        {'imdbRating': +1}
    ];
    
    sort = sortingMethods[req.query.sortBy];
      
  }
  console.log('pagination station: ', search);
  
  Scrape.find(search,{}, paginate).sort(sort).exec(function (err, scrapes) {
    if(err) { return handleError(res, err); }
    
    Scrape.count(search, function(err, count){
        
        var returnItem = {
            totalCount: count,
            items: scrapes         
        }

        
        return res.json(200, returnItem);
            
    });
    
    
  });
  
};

// Get a single scrape
exports.show = function(req, res) {
  Scrape.findById(req.params.id, function (err, scrape) {
    if(err) { return handleError(res, err); }
    if(!scrape) { return res.send(404); }
    return res.json(scrape);
  });
};

// Creates a new scrape in the DB.
exports.create = function(req, res) {
  Scrape.create(req.body, function(err, scrape) {
    if(err) { return handleError(res, err); }
    return res.json(201, scrape);
  });
};

// Updates an existing scrape in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Scrape.findById(req.params.id, function (err, scrape) {
    if (err) { return handleError(res, err); }
    if(!scrape) { return res.send(404); }
    var updated = _.merge(scrape, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, scrape);
    });
  });
};

// Deletes a scrape from the DB.
exports.destroy = function(req, res) {
  Scrape.findById(req.params.id, function (err, scrape) {
    if(err) { return handleError(res, err); }
    if(!scrape) { return res.send(404); }
    scrape.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
    console.log('error: ', err);
  //return res.send(500, err);
}