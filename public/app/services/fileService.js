angular.module('fileService', [])

    .factory('File', function ($http)
    {
        let fileFactory = {}; // Create the fileFactory object

        // Get the requested file
        fileFactory.getFile = function (fileLocation)
        {
            return $http.get('/api/file/' + fileLocation);
        };

        return fileFactory; // Return the fileFactory object
    });