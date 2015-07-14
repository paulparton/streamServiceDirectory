 angular.module('streamScraperApp') 
 
    .factory('paginationControls', function(){
        
         /**
         * Pagination functionality
         */
        return {
        	createButtons: generatePagesArray
        }
        
    	function generatePagesArray(currentPage, collectionLength, rowsPerPage, paginationRange) {
    
    		var pages = [],
    			totalPages = Math.ceil(collectionLength / rowsPerPage),
    			halfWay = Math.ceil(paginationRange / 2),
    			position,
    			ellipsesNeeded;
    			
    		//If the current page is located halfway or less in the pagination range starting at 1
    		if (currentPage <= halfWay) {
    			
    			//controls start at the start
    			position = 'start';
    		
    		//If the current page is...
    		} else if (totalPages - halfWay < currentPage) {
    			
    			//Controls start at the end
    			position = 'end';
    			
    		} else {
    			
    			//Otherwise controls start somewhere in the middle
    			position = 'middle';
    			
    		}
    
    		//Are there more pages than allowed in the normal pagination range? (are ... needed)
    		ellipsesNeeded = paginationRange < totalPages;
    		
    		var i = 1;
    		
    		//Loop while i is less than the total pages and the pagination range
    		while (i <= totalPages && i <= paginationRange) {
    			
    			//Get this page number
    			var pageNumber = calculatePageNumber(i, currentPage, paginationRange, totalPages);
    			
    			//on the second button, if the current position is middle or end, add the ...
    			var openingEllipsesNeeded = (i === 2 && (position === 'middle' || position === 'end'));
    			
    			//on the second last button, if the current position is middle or start, add the ...
    			var closingEllipsesNeeded = (i === paginationRange - 1 && (position === 'middle' || position === 'start'));
    			
    			//If this loop detirmined a set of ... is required
    			if (ellipsesNeeded && (openingEllipsesNeeded || closingEllipsesNeeded)) {
    				
    				//add it
    				pages.push('...');
    				
    			} else {
    				
    				//Otherwise add the current page number
    				pages.push(pageNumber);
    				
    			}
    			
    			//increment loop
    			i ++;
    			
    		}
    		
    		return pages;
    			
    	};
    	
    	function calculatePageNumber(i, currentPage, paginationRange, totalPages) {
            
            //Where i is the current position in the visible pagination buttons,
            //Which page number sits at each postion...
          
            //Get the halfway point of the max pagination buttons
            var halfWay = Math.ceil(paginationRange/2);
            
            //If this page is the last page
            if (i === paginationRange) {
              
              //Return the max page number
                return totalPages;
            
            //If this page is the first page
            } else if (i === 1) {
         
              //Return 1
                return i;
            
            //If there are more pages than pagination buttons
            } else if (paginationRange < totalPages) {
              
                //If the currently selected page is less than half a of the max buttons away from the end
                
                if (totalPages - halfWay < currentPage) {
     
                    //This pages relative position is from the first button on the last page of buttons
                    return totalPages - paginationRange + i;
                
                //If the currently selected page is higher than the first half of the first page of buttons
                } else if (halfWay < currentPage) {
                  //console.log(i + " = " + (currentPage - halfWay + i));
                  //This pages relative starting point it the selected page minus half of the max
                    return currentPage - halfWay + i;
                    
                } else {
                  //console.log(i + " = " + i + " inner else 1");
                    return i;
                    
                }
                
            } else {
            	
              //console.log(i + " = " + i + " inner else 2");
                return i;
                
            }
            
        }
        	
   
    })