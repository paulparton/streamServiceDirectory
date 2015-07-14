var scraper = require('../.././components/scraper');

module.exports = [
    {
        name: 'netflix',
        url: 'http://www.finder.com.au/netflix-tv-shows',
        parser:scraper.parseNetflixTv,
        add:{
            type:'tv'
        }
    },
    {
        name: 'netflix',
        url: 'http://www.finder.com.au/netflix-movies',
        parser:scraper.parseNetflixMovies,
        add:{
            type:'movies'
        }
    },
    {
        name: 'stan',
        url: 'http://www.finder.com.au/stan-tv-shows',
        parser: scraper.parseStanTv,
        add:{
            type:'tv'
        }
    },
    {
        name:'stan',
        url: 'http://www.finder.com.au/stan-movies',
        parser:scraper.parseStanMovies,
        add:{
            type:'movies'
        }
    },
    {
        name:'presto',
        url: 'http://www.finder.com.au/presto-movies',
        parser:scraper.parsePrestoMovies,
        add:{
            type:'movies'
        }
    },    
    {
        name:'presto',
        url: 'http://www.finder.com.au/presto-tv-shows',
        parser:scraper.parsePrestoTv,
        add:{
            type:'tv'
        }
    }        
];

