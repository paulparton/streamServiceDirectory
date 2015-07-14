'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ScrapeSchema = new Schema({
  name: String,
  type: String,
  sources: {},
  active: Boolean
},{ strict: false });

module.exports = mongoose.model('Scrape', ScrapeSchema);