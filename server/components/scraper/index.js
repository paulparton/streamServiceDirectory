
var request = require('request'),
	cheerio = require('cheerio'),
	http = require('http'),
	q = require('q');

var Scraper = function(){
	this.source = "";
	this.data = "";
	this.parsedData = "";
	return this;
};

module.exports = {
	
	parseNetflixTv: parseNetflixTv,
	parseNetflixMovies: parseNetflixMovies,
	parseStanTv: parseStanTv,
	parseStanMovies: parseStanMovies,
	parsePrestoTv: parsePrestoTv,
	parsePrestoMovies: parsePrestoMovies,
	loadOmdbData: loadOmdbData,
	parse: parseResult,
	get: loadSource,
	do: doSomething,
	save: saveToDb,
	load:load
}


function load(sources){
	
	var deferred = q.defer(),
		parsedData = [],
		completed = 0,
		created = 0, updated = 0;
	
	sources.forEach(function(item, i){
		
		request(item.url, function(err, res, body){
			
			if(err){deferred.reject(err)}
			
			//Parse the body
			var currentItemData = item.parser(body);
			
			//Add each item to parsedData
			currentItemData.forEach(function(videoItem){

				//Check if the item already exists
				var matches = parsedData.filter(function(pItem){
					
					//console.log(pItem.name.toLowerCase() + " / " + videoItem.name.toLowerCase());
					
					//console.log(pItem.type, item.add.type);
					
					if((pItem.name && videoItem.name && pItem.type && item.add.type) && (pItem.type == item.add.type) && (pItem.name.toLowerCase() == videoItem.name.toLowerCase())){
						return true;
						
					}else{
						return false;
					}
					
					/**
					if((pItem.name) && (pItem.name == videoItem.name) && (pItem.type == item.add.type)){
						console.log('matched: ', pItem.name, videoItem.name);
						//console.log('====================');
						return true;
					}else{
						return false;
					}
					 */
					//return pItem.name == videoItem.name;
					
				});
				
				if(matches.length === 0){
					
					var newItem = {
						name: videoItem.name,
						type: item.add.type,
						sources:{},
						sourceNames:[item.name] 
					};
					
					newItem.sources[item.name] = videoItem;
					
					parsedData.push(newItem);
					
					created++;
						
				}else{
					
					//console.log('match found, add ' + item.name + '?');
					
					var matchedId = parsedData.indexOf(matches[0]);
					
					//If it does, check if the current source is added
					if(!parsedData[matchedId].sources[item.name]){
						parsedData[matchedId].sources[item.name] = videoItem;
						
						if(parsedData[matchedId].sourceNames.indexOf(item.name) == -1){
							parsedData[matchedId].sourceNames.push(item.name);
						}
						
						updated++;
					}
					
				}					
		
				
								
			});
			
			completed++;
			
			if(completed == sources.length){
				
				console.log('All items loaded from sources: ' + created + ' / updated: ' + updated);
				
				//Parse all with omdb
				//loadOmdbData(parsedData).then(function(omdbParsedData){
					deferred.resolve(parsedData);	
				//});
			
			}
				
		}.bind(this));
		
	});
	
	return deferred.promise;
}

function saveToDb(model){
	var that = this;
	console.log("parsing - " + this.sourceName);
	
	var created = 0, updated = 0, nochange = 0;
	
	//console.log('save: ', this.parsedData);
	//With each item currently in the parsedData property
	this.parsedData.forEach(function(item){
		
		//Find the current item in the
		model.find({name:item.name, type:item.type}, function(err, result){
			if(err){console.log('find error:', err);}
			//If the item exists
			if(result[0] && result[0].sources){
				
				//console.log(result[0].name + " located ");
				
				//Is the current source listed
				if(!result[0].sources[that.sourceName]){
					
					
					if(result[0].sourceNames.indexOf(that.sourceName) == -1){
						result[0].sourceNames.push(that.sourceName)
					}
					
					//console.log(result[0].name + " didn't have " + that.sourceName);
					
					//Add the current source
					//result[0].sources[that.sourceName] = item;
					
					updated ++;
					
					result[0].save(function(err, res){
						if(err){console.log('update error:', err);}
						
						//console.log('added ' + that.sourceName + ' to ' + res.name);
						done(item);
						
					});	
				}else{
					
					nochange++;
					done(item);
				}
				
				
			}else{
				
				created++
				//console.log(item.name + " not found");
				var newItem = {
					'name':item.name,
					'type':item.type,
					'sources': {
					},
					sourceNames:[item.source]
				}
				
				newItem.sources[that.sourceName] = item;
				
				//console.log('save: ', newItem);
				model.create(newItem, function(err, result){
					if(err){console.log('create error:', err);}
					//console.log('saved:', result);
					done(item);
				});
				
			}

		});
		//console.log('==============================')
		//console.log('working', item);
		//console.log('==============================')
		//If it doesn't existin the database add it
		//If it does, but doesn't have the current source listed add it
		//If it does, do nothing.
		
	});
	
	function done(item){
		
		if(item == that.parsedData[that.parsedData.length - 1]){
			console.log('created: ' + created);
			console.log('updated: ' + updated);
			console.log('no change: ' + nochange)	
		}
		
	}
		
}

function parseResult(parser){
	
	//console.log("parsing!")
	
	//console.log (parser.call(this, this.data));
	this.parsedData = parser.call(this, this.data);
	
}

/**
 * Transforms an array of netflix objects to stream-scraper objects
 * @param {Array} netflixItems - An array of netflix media objects
 */
function parseNetflixTv(body){
	
	this.sourceName = "netflix"
	
	var items = parseBasic(body); 
	//console.log(items[0],items[1], items[2]);
	items.forEach(function(item, i){
		item.source = this.sourceName;
		items[i].name = item['tv show name'];
		delete items[i]['tv show name'];

		items[i].year = item['year of release'];
		delete items[i]['year of release'];
		
		items[i].netflixReleaseDate = items[i]['netflix release date']
		
		delete items[i]['netflix release date'];
		
		items[i].type = "TV Shows";
		delete items[i].genre;				
		
		delete items[i]['runtime (minutes)'];
		
		delete items[i]['actor(s)']
  		delete items[i]['director(s)']
		delete items[i]['\n']		  
		  
		
	});	
	return items;
}
 
/**
 * Transforms an array of netflix objects to stream-scraper objects
 * @param {Array} netflixItems - An array of netflix media objects
 */
function parseNetflixMovies(body){
	this.sourceName = "netflix"
	var items = parseBasic(body); 
	
	items.forEach(function(item, i){
		item.source = this.sourceName;
		items[i].name = item['movie name'];
		delete items[i]['movie name'];

		items[i].year = item['year of release'];
		delete items[i]['year of release'];
		
		items[i].netflixReleaseDate = items[i]['netflix release date']
		
		delete items[i]['netflix release date'];
		
		items[i].type = 'Movies';				
		
		delete items[i]['runtime (minutes)'];
		
		delete items[i]['actor(s)']
  		delete items[i]['director(s)']
		delete items[i]['\n']		  
		  
		
	});
	
	//console.log(items);
	return items;
}

/**
 * Transforms an array of stan objects to stream-scraper objects
 * @param {Array} stanItems - An array of stan media objects
 */
function parseStanTv(body){
	
	this.sourceName = "stan"
	
	var newOut = [],
		items = parseBasic(body);
	
	//console.log("parse stan...", items.length);
		
	items.forEach(function(item){
		
		
		if(item['tv show name']){
			item.title = item['tv show name'];
			delete item['tv show name'];
		}
		
		item.source = this.sourceName;
		item.type = "TV Shows";
		item.title = item.title.toLowerCase().replace(/ - season [0-9+]/, '');
		item.title = item.title.toLowerCase().replace(/ season [0-9+]/, '');
		
		var existsAlready = newOut.filter(function (obj){
		
			return obj.title == item.title;

		});
		
		if(existsAlready.length === 0){
			
			if(item['season number'] != ""){
				newOut.push(item);	
			}
			
		}
		
	});
	
	newOut.forEach(function(item, i){

		delete newOut[i]['\n']	
		delete newOut[i]['runtime (minutes)'];
		delete newOut[i]['director'];
		delete newOut[i]['imdb rating'];
		newOut[i].name = item['title'];
		delete newOut[i]['title'];
		newOut[i].stanReleaseDate = newOut[i]['stan. release date'];
		delete newOut[i]['stan. release date'];
				
	});
	
	//console.log(newOut[0], newOut[1], newOut[2], newOut[3]);
	
	return newOut;

}

/**
 * Transforms an array of stan objects to stream-scraper objects
 * @param {Array} stanItems - An array of stan media objects
 */
function parseStanMovies(body){
	
	this.sourceName = "stan"
	
	var newOut = [],
		items = parseBasic(body);
	
	//console.log("parse stan...", items.length);
		
	items.forEach(function(item){
		item.source = this.sourceName;
		items.name = item['movie name'];
		delete item['movie name'];
		
		//item.title = item.title.toLowerCase().replace(/ - season [0-9+]/, '');
		item.type = "Movies";
		var existsAlready = newOut.filter(function (obj){
		
			return obj.title == item.title;

		});
		
		if(existsAlready.length === 0){

			newOut.push(item);
		}
		
	});
	
	newOut.forEach(function(item, i){

		delete newOut[i]['\n']	
		delete newOut[i]['runtime (minutes)'];
		delete newOut[i]['director'];
		delete newOut[i]['imdb rating'];
		newOut[i].name = item['title'];
		delete newOut[i]['title'];
		newOut[i].stanReleaseDate = newOut[i]['stan. release date'];
		delete newOut[i]['stan. release date'];
						
	});
	
	//console.log(newOut[0], newOut[1], newOut[2], newOut[3]);
	
	return newOut;

}

/**
 * Transforms an array of presto objects to stream-scraper objects
 * @param {Array} prestoItems - An array of presto media objects
 */
function parsePrestoTv(body){
	
	this.sourceName = "presto"
	
	var newOut = [],
		items = parseBasic(body);
	
	//console.log("parse stan...", items.length);
		
	items.forEach(function(item){
		
		
		if(item['tv show name']){
			item.title = item['tv show name'];
			delete item['tv show name'];
		}
		
		item.source = this.sourceName;
		
		item.type = "TV Shows";
		item.title = item.title.toLowerCase().replace(/ - season [0-9+]/, '');
		item.title = item.title.toLowerCase().replace(/ season [0-9+]/, '');
		var existsAlready = newOut.filter(function (obj){
		
			return obj.title == item.title;

		});
		
		if(existsAlready.length === 0){

			newOut.push(item);
		}
		
	});
	
	newOut.forEach(function(item, i){

		delete newOut[i]['\n']	
		delete newOut[i]['runtime (minutes)'];
		delete newOut[i]['director'];
		delete newOut[i]['imdb rating'];
		newOut[i].name = item['title'];
		delete newOut[i]['title'];
		newOut[i].stanReleaseDate = newOut[i]['stan. release date'];
		delete newOut[i]['stan. release date'];
				
	});
	
	//console.log(newOut[0], newOut[1], newOut[2], newOut[3]);
	
	return newOut;
	
}

/**
 * Transforms an array of presto objects to stream-scraper objects
 * @param {Array} prestoItems - An array of presto media objects
 */
function parsePrestoMovies(body){
	
	this.sourceName = "presto"
	
	var newOut = [],
		items = parseBasic(body);
	
	//console.log("parse stan...", items.length);
		
	items.forEach(function(item){
	
		item.title = item['movie title'];
		delete item['movie title'];
		
		//item.title = item.title.toLowerCase().replace(/ - season [0-9+]/, '');
		item.type = "Movies";
		var existsAlready = newOut.filter(function (obj){
		
			return obj.title == item.title;

		});
		
		if(existsAlready.length === 0){

			newOut.push(item);
		}
		
	});
	
	newOut.forEach(function(item, i){

		delete newOut[i]['\n']	
		delete newOut[i]['runtime (minutes)'];
		delete newOut[i]['director'];
		delete newOut[i]['imdb rating'];
		newOut[i].name = item['title'];
		delete newOut[i]['title'];
		newOut[i].stanReleaseDate = newOut[i]['stan. release date'];
		delete newOut[i]['stan. release date'];
						
	});
	
	//console.log(newOut[0], newOut[1], newOut[2], newOut[3]);
	
	return newOut;	
}

/**
 * Does the basic minial parsing requred for every provider
 */
function parseBasic(body){
	
	var items = [],
		output = [],
		headings = [];
	
	var $ = cheerio.load(body);
	
	//Get table contents
	$('.entry .custom-table tr').each(function(){
		items.push($(this).html());	
	});
	
	//Pull out the first row for headings
	var headingsSrc = items.splice(0, 1);
	
	//Store headings in an array
	$(headingsSrc[0]).each(function(){
		headings.push($(this).text());
	});
	
	//Loop through each content rpw
	items.forEach(function(item){
		
		var tempItem = {};			
		
		$(item).each(function(td){
			
			tempItem[headings[td].toLowerCase()] = $(this).text();
				
		});
		
		output.push(tempItem);		
		
	});
	
	//this.parsedData = output;
	
	return output;
}

/**
 * Gets data from the OMDB (Open Movie DataBase)
 * @param {Array} mediaItem - A stream-scraper mediaItem for querying.
 */
function loadOmdbDataMulti(mediaItems){
	
	var deferred = q.defer(),
		processed = 0;
	
	
	if(mediaItems instanceof Array){
		
		var types = {
			'tv': 'series',
			"movies": 'movie'
		}
		
		doRequest(mediaItems[0], 0);
		
		//mediaItems.forEach(function(item, i){
		function doRequest(item, i){	
			request("http://omdbapi.com/?apikey=9080cac6&t=" + item.name + "&type=" + types[item.type], function(err, resp, body){
				
				if(err){
					console.log('OMDB ERROR!!', err);
					mediaItems[i].active = false;
					mediaItems[i].omdbError = err;
				}
				
				if(body.indexOf('<!DOCTYPE html PUBLIC') !== -1){
					mediaItems[i].omdbError = err;
					console.log ("http://omdbapi.com/?apikey=9080cac6&t=" + item.name + "&type=" + types[item.type]);
				}else{
					mediaItems[i].omdb = JSON.parse(body);
					console.log(i + ' success :' + item.name);
				}
				
				//console.log(body);
				
				processed++
				
				if(processed === mediaItems.length){
					
					deferred.resolve(mediaItems);
					
				}else{
					i++;
					setTimeout(function(){
						doRequest(mediaItems[i], i);
					},50);
				}
				
			})
		}
		//});
		 
	}
	
	return deferred.promise;
}


/**
 * Gets data from the OMDB (Open Movie DataBase)
 * @param {Array} mediaItem - A stream-scraper mediaItem for querying.
 */
function loadOmdbData(item, callback){
	
	var deferred = q.defer();

		var singleCharacterSearchFix = '';
		var types = {
			'tv': 'series',
			"movies": 'movie'
		}
		
		if(item.name.length === 1){
			singleCharacterSearchFix = '%20';
		}
		
		request("http://omdbapi.com/?apikey=9080cac6&t=" + item.name + singleCharacterSearchFix + "&type=" + types[item.type], function(err, resp, body){
			
			var attempts = 0;
			
			if(err){
				console.log('OMDB ERROR!!', err);
				item.active = false;
				item.omdbError = err;
			}
			
			if(body){
				
			setTimeout(doParse, 200);
			
			}
			
			function doParse(){
				
				if(body.indexOf('<!DOCTYPE html') !== -1 || body.indexOf('not found') !== -1){
					item.active = false;
					if(attempts > 2){
						item.omdbError = body;
						item.active = false;
						console.log ("http://omdbapi.com/?apikey=9080cac6&t=" + item.name + "&type=" + types[item.type]);
					}else{
						console.log(item.name + ' fail ' + attempts);
						item.active = false;
						attempts++;
						setTimeout(doParse, 300);
					}	
											
				}else{
					var omdbResult = JSON.parse(body);
					if(omdbResult.imdbRating == 'N/A'){
						omdbResult.imdbRating = 0;
					}
					item.imdbRating = omdbResult.imdbRating;
					item.omdb = omdbResult;
					item.active = true;
					item.imdbId = omdbResult.imdbID;
					delete item.omdbSecond;
					delete item.newVal;
					delete item.processed;					
				}
				
				return callback(item);
				
			}
			//console.log('finished - ', item.name);
			
			//console.log('resolve:', item.processed);
			//deferred.resolve(item);
			
		})
	
		//});
	
	//return deferred.promise;
}

/**
 * Gets data from the OMDB (Open Movie DataBase)
 * @param {Array} sourceUrl - The url to retrieve data from
 */
function loadSource(sourceUrl){
	
	var deferred = q.defer();
	
	this.source = sourceUrl;
	
	request(sourceUrl, function(err, res, body){
		
		if(err){deferred.reject(err)}
		
		this.data = body;
		
		deferred.resolve(this);
		
	}.bind(this));
	
	return deferred.promise;
}

function doSomething(callback){
	
	callback(this.data, this.paresdData);
	
}