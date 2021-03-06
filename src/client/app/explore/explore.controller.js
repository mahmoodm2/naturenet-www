/* global google */
(function () {
  'use strict';

  angular
    .module('app.explore')
    .controller('ExploreController', ExploreController);

  /* Explore controller
     ======================================================================== */

  ExploreController.$inject = [
    '$q',
    '$rootScope',
    '$scope',
    '$timeout',
    'logger',
    'config',
    'utility',
    'dataservice',
    'NgMap',
  ];

  /* @ngInject */
  function ExploreController(
    $q,
    $rootScope,
    $scope,
    $timeout,
    logger,
    config,
    utility,
    dataservice,
    NgMap
  ) {
    var vm = this;
    vm.title = 'Explore';

    /* Variables
       ================================================== */

    // Data
    vm.map = void 0;
    vm.localObservationIds = void 0;
    vm.observations = void 0;
    vm.currentObservation = void 0;
    vm.currentProject = void 0;
    vm.comments = void 0;
    vm.maxPoints = 100;

    // States
    $scope.$parent.hasMap = false;
    vm.hasSidebar = false;
    vm.isObservationsListVisible = true;
    vm.showDetail = false;

    // Function assignments
    vm.toggleMap = toggleMap;
    vm.showSidebar = showSidebar;
    vm.hideSidebar = hideSidebar;
    vm.formatDate = utility.formatDate;
    vm.onMapMoved = onMapMoved;
    vm.select = select;

    activate();

    /* Activate function
       ================================================== */

    function activate() {
      utility.showSplash();

      var promises = [getObservations()];
      return NgMap.getMap()
        .then(function (map) {
          logger.info('Google Maps Ready');
          vm.map = map;
          initializeMap();

          $q.all(promises)
            .then(function () {
              utility.hideSplash();
              logger.info('Activated Map View');
            });
        });
    }

    /* Data functions
       ================================================== */

    function getObservations() {
      return dataservice.getArray('observations')
        .then(function (data) {
          vm.observations = data;
          return vm.observations;
        });
    }

    function select(id) {
      if (!!id) {
        dataservice.getObservationById(id).then(function (o) {
          if (o.$value !== null) {
            vm.currentObservation = o;
          } else {
            logger.warning('This observation cannot be displayed.');
          }
        });
      }
    }

    /* Listener Functions
       ================================================== */

    $scope.$watch('vm.currentObservation', currentObservationUpdated);

    function currentObservationUpdated() {
      showSidebar(vm.currentObservation);
      updateMap(vm.currentObservation);
    }

    $scope.$on('delete', function (event, id) {
      if (id === vm.currentObservation.id) {
        vm.currentObservation = void 0;
      }
    });

    $scope.$on('view', function (event, id) {
      if (!!id) {
        vm.showDetail = true;
      }
    });

    /* Map functions
       ================================================== */

    function initializeMap() {
      var coords = dataservice.getGeolocation();

      if (!!coords) {
        config.mapOptions.center = new google.maps.LatLng(coords.latitude, coords.longitude);
        config.mapOptions.zoom = 12;
      }

      config.mapOptions.mapTypeId = google.maps.MapTypeId.HYBRID;

      vm.map.setOptions(config.mapOptions);

      $scope.$broadcast('map:init');

      $rootScope.$on('map:toggle', toggleMap);
      $rootScope.$on('map:show', showMap);
      $rootScope.$on('map:hide', hideMap);
      $rootScope.$on('auth:success', showSite);
    }

    function onMapMoved() {
      if (!!vm.map) {
        dataservice.getObservationsNear(vm.map.getCenter(), getMapRadiusKm(), vm.maxPoints)
          .then(function (response) {
            vm.localObservationIds = response;
          });
      }
    }

    function getMapRadiusKm() {
      var radius = 1;
      var bounds = vm.map.getBounds();
      var center = vm.map.getCenter();
      if (bounds && center) {
        var ne = bounds.getNorthEast();
        var radius = google.maps.geometry.spherical.computeDistanceBetween(center, ne);
        radius = Math.floor(radius / 1000);
      }

      return radius;
    }

    function showSite(userId) {
      dataservice.getActiveUser().then(function (user) {
        dataservice.getSiteById(user.affiliation)
          .then(function (site) {
            if (!!site) {
              var newCenter = new google.maps.LatLng({ lat: site.l[0], lng: site.l[1], });
              vm.map.panTo(newCenter);
              vm.map.setZoom(12);
            }
          });
      });
    }

    function resetMap() {
      config.mapOptions.center = new google.maps.LatLng({ lat: 37.2758365, lng: -104.6536539, });
      config.mapOptions.zoom = 4;
      vm.map.setOptions(config.mapOptions);
    }

    function updateMap(o) {
      if (!!vm.map) {
        if (!o || !o.l || angular.equals(o.l, [0, 0])) {
          return resetMap();
        }

        var newCenter = new google.maps
          .LatLng({ lat: o.l[0], lng: o.l[1], });
        var currentZoom = vm.map.getZoom();

        vm.map.panTo(newCenter);

        if (currentZoom < 18) {
          vm.map.setZoom(18);
        }
      }
    }

    function toggleMap() {
      $scope.$parent.hasMap = !$scope.$parent.hasMap;
    }

    function showMap(event, o) {
      if (!!o) { vm.currentObservation = o; }

      $scope.$parent.hasMap = true;
    }

    function hideMap() {
      $scope.$parent.hasMap = false;
    }

    /* Sidebar functions
       ================================================== */

    function showSidebar(o) {
      vm.currentObservation = o;
      vm.hasSidebar = true;
      vm.showDetail = false;

      vm.currentProject = void 0;
      if (!!o) {
        dataservice.getProjectById(o.activity).then(function (data) {
          vm.currentProject = data;
        });
      }

      loadComments(vm.currentObservation);
    }

    function hideSidebar() {
      vm.hasSidebar = false;
    }

    function loadComments() {
      vm.comments = void 0;
      if (!!vm.currentObservation) {
        return dataservice.getCommentsForRecord(vm.currentObservation)
          .then(function (data) {
            vm.comments = data;
            return vm.comments;
          });
      }
    }

  }
})();
