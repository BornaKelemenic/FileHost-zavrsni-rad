let app = angular.module('appRoutes', ['ngRoute'])

// Configure Routes; 'authenticated = true' means the user must be logged in to access the route
    .config(function ($routeProvider, $locationProvider)
    {

        // AngularJS Route Handler
        $routeProvider

        // Route: Home
            .when('/', {
                templateUrl: 'app/views/pages/home.html'
            })

            // Route: User Registration
            .when('/register', {
                templateUrl: 'app/views/pages/users/register.html',
                controller: 'regCtrl',
                controllerAs: 'register',
                authenticated: false
            })

            // Route: User Login
            .when('/login', {
                templateUrl: 'app/views/pages/users/login.html',
                authenticated: false
            })

            // Route: User Profile
            .when('/profile', {
                templateUrl: 'app/views/pages/users/profile.html',
                authenticated: true
            })

            // Route: Manage User Accounts
            .when('/management', {
                templateUrl: 'app/views/pages/management/management.html',
                controller: 'managementCtrl',
                controllerAs: 'management',
                authenticated: true,
                permission: ['admin', 'moderator']
            })

            // Route: Edit a User
            .when('/edit/:id', {
                templateUrl: 'app/views/pages/management/edit.html',
                controller: 'editCtrl',
                controllerAs: 'edit',
                authenticated: true,
                permission: ['admin', 'moderator']
            })

            // Route: Search Database Users
            .when('/search', {
                templateUrl: 'app/views/pages/management/search.html',
                controller: 'managementCtrl',
                controllerAs: 'management',
                authenticated: true,
                permission: ['admin', 'moderator']
            })

            // Route: Gets the requested file
            .when('/uploads/:folder', {
                templateUrl: 'app/views/pages/uploads/getFile.html',
                controller: 'fileCtrl',
                controllerAs: 'file'
            })

            // Rerout to uploaded file
            .when('/upload', {
                template: '<h1>Uploading.....</h1>',
                controller: ['$location', function($location) {
                    $location.path("/")
                }]
            })
            .otherwise({redirectTo: '/'}); // If user tries to access any other route, redirect to home page

        $locationProvider.html5Mode({enabled: true, requireBase: false}); // Required to remove AngularJS hash from URL (no base is required in index file)
    });

// Run a check on each route to see if user is logged in or not (depending on if it is specified in the individual route)
app.run(['$rootScope', 'Auth', '$location', 'User', function ($rootScope, Auth, $location, User)
{

    // Check each time route changes    
    $rootScope.$on('$routeChangeStart', function (event, next, current)
    {

        // Only perform if user visited a route listed above
        if (next.$$route !== undefined)
        {
            // Check if authentication is required on route
            if (next.$$route.authenticated === true)
            {
                // Check if authentication is required, then if permission is required
                if (!Auth.isLoggedIn())
                {
                    event.preventDefault(); // If not logged in, prevent accessing route
                    $location.path('/'); // Redirect to home instead
                }
                else if (next.$$route.permission)
                {
                    // Function: Get current user's permission to see if authorized on route
                    User.getPermission().then(function (data)
                    {
                        // Check if user's permission matches at least one in the array
                        if (next.$$route.permission[0] !== data.data.permission)
                        {
                            if (next.$$route.permission[1] !== data.data.permission)
                            {
                                event.preventDefault(); // If at least one role does not match, prevent accessing route
                                $location.path('/'); // Redirect to home instead
                            }
                        }
                    });
                }
            }
            else if (next.$$route.authenticated === false)
            {
                // If authentication is not required, make sure is not logged in
                if (Auth.isLoggedIn())
                {
                    event.preventDefault(); // If user is logged in, prevent accessing route
                    $location.path('/profile'); // Redirect to profile instead
                }
            }
        }
    });
}]);