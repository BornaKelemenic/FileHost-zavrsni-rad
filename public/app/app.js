angular.module('userApp', ['appRoutes', 'userControllers', 'userServices', 'ngAnimate', 'mainController', 'authServices', 'managementController', 'fileController', 'fileService'])

.config(function($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptors');
});
