'use strict';

angular.module('streamScraperApp')
    .controller('MainCtrl', mainController);

mainController.$inject = ['$scope', '$http', '$timeout', 'paginationControls', '$modal', '$rootScope'];

function mainController($scope, $http, $timeout, paginationControls, $modal, $rootScope) {
    
    var vm = this;
    
    //Display the search filters
    vm.showFilters = false;
    
    vm.dataLoaded = false;
    
    //Number of results to display on each page
    vm.limit = 10;
    
    //Current page
    vm.currentPage = 0;
    
    //Sorting method
    vm.sortBy = 0;
    
    //Possible sorting methods
    vm.sortingMethods = [
        'Name: a-z',
        'Name: z-a',
        'Rating: highest first',
        'Rating: lowest first'
    ];
    
    //The view layout
    vm.viewType = 'list';
    
    //Service providers to filter by
    vm.sourceFilter = [];
    
    //Media types to be filtered by
    vm.typeFilter = [];
    
    /**
     * toggleType - Adds or removed an item from the list of media types to filter results by
     */
    vm.toggleType = function(newType){
        
        //Add or remove a type from the list of media types to filter by
        vm.sourceFilter = addOrRemove(vm.sourceFilter, newType);
        
        //Refresh results from the server
        vm.loadItems();
                
    }
    
    /**
     * toggleType - Adds or removed an item from the list of media types to filter results by
     */
    vm.toggleProvider = function(newProvider){

        //Add or remove the new provider from the list of providers to filter by
        vm.sourceFilter = addOrRemove(vm.sourceFilter, newProvider)
        
        //Refresh results from the server
        vm.loadItems();
        
    }
    

    
    //Retrieve the current page of results from the server
    vm.getItems = function(url){
        
        $http.get(url)
            .success(getDataSuccess, getDataError);
        
    }
    
    //Build the URL to get the current page of results from the server
    vm.buildRequestUrl = function(options){
        
        //Define base URL and add it to the URL being built
        var baseUrl = '/api/scrape?',
            url = baseUrl;
        
        //Loop through the provided URL options      
        for(var key in options){
            
            //Eliminate prototype properties and "undefined" properties
            if(options.hasOwnProperty(key) && typeof options[key] !== 'undefined'){
                
                //Get the current item
                var newValue = options[key];
                
                //IF the current item is an array
                if(options[key] instanceof Array){
                    
                    //and the array isn't empty
                    if(options[key].length > 0){
                        
                        //convert the current item into a comma separated string
                        newValue = options[key].join(',');
                        
                        //Add the string to the url
                        url += key + '=' + newValue + '&';
                    }
                    
                }else{
                    
                    //Add the string to the url
                    url += key + '=' + newValue + '&';
                        
                }
                       
            }
            
        }
        
        //Return the new URL
        return url.substring(0, url.length - 1);
        
    }
    
    //refresh the results with the current parameters
    vm.loadItems = function(){
        
        var urlOptions = {
            'skip': vm.currentPage * vm.limit, 
            'limit': vm.limit, 
            'search': vm.searchText, 
            'source': vm.sourceFilter, 
            'mediaType': vm.typeFilter,
            'sortBy': vm.sortBy || 0 
        };

        var requestUrl = vm.buildRequestUrl(urlOptions);
        
        vm.getItems(requestUrl);
        
    };

    /**
     * Functions for navigating the paginated data.
     * --Move these into a pagination directive
     */
	vm.nextPage = function(){

		if(((vm.currentPage + 1)*vm.limit)  < vm.totalCount){
			
			vm.currentPage +=1;

		}

	};

	vm.previousPage = function(){
		
		if(vm.currentPage > 0){
			vm.currentPage -=1;
		}

	};
    
	vm.goToPage = function(newPageNumber){

		vm.currentPage = newPageNumber;

	};


    /**
     * Start the app by retrieving initial results
     */
    vm.loadItems();
    
    /**
     * $watch statements for reloading results
     */
    
    //When the user enters search text
    $scope.$watch(function(){
           
           return vm.searchText;
            
        }, 
        function(newVal, oldVal){
        
        //Reset the current page back to the first
        vm.currentPage = 0;
        
        //Check this isn't triggered by the page loading
        if(newVal !== oldVal){
    
            //Delay a briefly
            $timeout(function(){
                
                //Reload results
                vm.loadItems();
            
            },1000);
        
        }

    });
    
    //When the current page changes
    $scope.$watch(function(){
            
            return vm.currentPage;
            
        },function(newVal, oldVal){
            
            if(newVal !== oldVal){
                vm.loadItems();       
            }
         
    });

    //When the number of results to display changes, reload from server
    $scope.$watch(function(){
            
            return vm.limit;
            
        },function(newVal, oldVal){
  
            if(newVal !== oldVal){

                vm.loadItems();
       
            }
      
    });    

    //When the sorting order of the list is changed, refresh from the server
    $scope.$watch(function(){
            
            return vm.sortBy;
            
        },function(newVal, oldVal){
            
            if(newVal !== oldVal){
                vm.loadItems();       
            }
      
    });  
  
     /**
     * getDataSuccess - The success handler for requsting data from the server
     */
      function getDataSuccess(result){
        
        //Delay before updating the view
        $timeout(function(){
            
            //Update the view
            vm.dataLoaded = true;
    
        },750)
        
        //Save items to view model
        vm.items = result.items;
        
        //Save total number of items in dataset to view model
        vm.totalCount = result.totalCount;
        
        //Create the pagination buttons
        vm.buttonArray = paginationControls.createButtons(vm.currentPage, vm.totalCount, vm.limit, 10);
        
    }
    
    /**
     * getDataError - The error handler for requsting data from the server
     */
    function getDataError(err){
        console.log('error loading data from server: ', err);
    }
  
      /**
     * addOrRemove - Adds targetItem to targetArray if it isn't there, and removes it if it is
     */
    function addOrRemove (targetArray, targetItem){
        
        //If the item provided isn't in the array provided
        if(targetArray.indexOf(targetItem) == -1){
            
            //Add it
            targetArray.push(targetItem);
            
            //Return the modified array
            return targetArray;
            
        }
        
        //If the item already exists, remove it
        targetArray.splice(targetArray.indexOf(targetItem), 1);
        
        //and return the modified array
        return targetArray;
        
    }
    
      
 }
