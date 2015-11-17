'use strict';

/**
 * @ngdoc overview
 * @name naturenetWebApp
 * @description
 * # naturenetWebApp
 *
 * Main module of the application.
 */
angular
    .module('naturenetWebApp', [
        'ngAnimate',
        'ngCookies',
        'ngMap',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'naturenetWebApp.filters',
        'angularUtils.directives.dirPagination',
        'bootstrapLightbox'
    ])
    .config(function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/home.html',
                controller: 'MainCtrl'
            })
            .when('/observations', {
                templateUrl: 'views/observations.html',
                controller: 'ObservationListCtrl'
            })
            .when('/activities', {
                templateUrl: 'views/activities.html',
                controller: 'ActivityListCtrl'
            })
            .when('/designs', {
                templateUrl: 'views/designs.html',
                controller: 'DesignIdeaListCtrl'
            })
            .when('/observation/:id', {
                templateUrl: 'views/observation.html',
                controller: 'ObservationCtrl'
            })
            .when('/about', {
              templateUrl: 'views/about.html',
              controller: 'AboutCtrl'
            })
            .when('/map', {
                templateUrl: 'views/map.html',
                controller: 'MapCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });
    }).config(function(LightboxProvider) {
        // set a custom template
        LightboxProvider.templateUrl = 'views/observation-lightbox.html';
    });