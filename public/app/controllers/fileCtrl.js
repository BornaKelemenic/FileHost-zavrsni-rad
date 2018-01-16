angular.module('fileController', [])
// FileCtrl is controller for user to get the requested file
    .controller('fileCtrl', function ($routeParams, File)
    {
        let app = this;

        // Funtion that gets the file
        function getFile()
        {
            File.getFile($routeParams.folder).then(function (data)
            {
                app.trazeniFile = data.data.file;
                //console.log(data.data);
            });
        }

        getFile();
    });