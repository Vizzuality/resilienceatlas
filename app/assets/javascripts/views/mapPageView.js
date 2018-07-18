(function(root) {

  'use strict';

  root.app = root.app || {};

  root.app.MapPageView = Backbone.Router.extend({


    initialize: function(settings) {
      var opts = settings && settings.options ? settings.options : {};
      this.options = _.extend({}, this.defaults, opts);
      this.setListeners();

      this.router = settings.router;
      this.siteScopeId = settings.siteScopeId;
      this.subdomainParams = settings.subdomainParams;
      this.embed = settings.embed || false;

      this.initMap();
    },

    setListeners: function() {
    },

    getMapCenter: function() {
      if ( this.subdomainParams && !isNaN(this.subdomainParams.lat) && !!(this.subdomainParams.lat + 1) ) {
        return [this.subdomainParams.lat, this.subdomainParams.lng];
      } else {
        return [3.86, 47.28];
      }
    },

    getMapZoom: function() {
      if ( this.subdomainParams && !isNaN(this.subdomainParams.zoom_level) && !!(this.subdomainParams.zoom_level + 1) ) {
        return this.subdomainParams.zoom_level;
      } else {
        return 3;
      }
    },

    initMap: function() {
      var journeyMap = this._checkJourneyMap();
      var toolbarView = new root.app.View.Toolbar();
      var layersGroupsCollection = new root.app.Collection.LayersGroups();
      var layersCollection = new root.app.Collection.Layers();
      var mapModel = new (Backbone.Model.extend({
        defaults: {
          journeyMap: journeyMap,
          countryIso: this.router.params.attributes && this.router.params.attributes.countryIso ? this.router.params.attributes.countryIso : null,
          maskSql: this.router.params.attributes && this.router.params.attributes.maskSql ? this.router.params.attributes.maskSql : null
        }
      }));

      // Predictive models
      var predictiveModelsCollection = new root.app.Collection.Models(null, {
        siteScopeId: this.siteScopeId
      });
      var activePredictiveModel = new (Backbone.Model.extend({
        /**
         * Return the layer corresponding to the parameter
         * of the model
         * @returns {object}
         */
        getLayer: function() {
          return {
            id: -1,
            slug: 'predictive-model-layer',
            name: this.get('name'),
            type: 'raster',
            description: '{"description":"' + (this.get('description') || '') + '", "source":"' + (this.get('source') || '') + '"}',
            cartocss: '#layer {\r\nraster-opacity:1;\r\nraster-scaling:near;\r\nraster-colorizer-default-mode:linear;\r\nraster-colorizer-default-color: transparent;\r\nraster-colorizer-epsilon:0.05;\r\nraster-colorizer-stops:\r\nstop(-0.01, transparent)\r\nstop(0,  #456e21)\r\nstop(0.2, #6e8e39)\r\nstop(0.4, #456e21)\r\nstop(0.5, #94e334)\r\nstop(0.6, #e2a83c)\r\nstop(0.8, #2473ff)\r\nstop(1, #e59898)\r\n}',
            interactivity: '',
            sql: 'select * from getModel(' + this.get('id') + ', [' + this.get('indicators').map(function(ind) { return ind.value % 1 === 0 ? ind.value : ind.value.toFixed(3); }) + '])',
            color: '',
            opacity: 1,
            no_opacity: false,
            order: 1,
            maxZoom: 25,
            minZoom: 0,
            legend: '{"type": "choropleth",\r\n"min":"0",\r\n"max":"1",\r\n"bucket":["#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850"]}',
            group: -1,
            active: true,
            published: true,
            info: '{"description":"' + (this.get('description') || '') + '", "source":"' + (this.get('source') || '') + '"}',
            dashboard_order: null,
            download: false,
            dataset_shortname: null,
            dataset_source_url: null,
            attributions: false
          };
        }
      }));

      var mapCenter = this.getMapCenter();
      var mapZoom = this.getMapZoom();

      var mapView = new root.app.View.Map({
        el: '#mapView',
        layers: layersCollection,
        basemap: this.router.params.attributes.basemap,
        model: mapModel,
        predictiveModel: activePredictiveModel,
        router: this.router,
        subdomainParams: this.subdomainParams,
        options: {
          map: {
            zoom: this.router.params.attributes.zoom || mapZoom,
            minZoom: 2,
            maxZoom: 25,
            center: this.router.params.attributes.center ? [ JSON.parse(this.router.params.attributes.center).lat, JSON.parse(this.router.params.attributes.center).lng] : mapCenter,
            zoomControl: false,
            scrollWheelZoom: !this.embed ? true : false
          }
        }
      });

      // At begining create a map
      mapView.createMap();

      // We init the sidebar after the map so the sidebar
      // can tell the map its initial state and offset it
      var sidebarView = new root.app.View.Sidebar({
        router: this.router,
        subdomainParams: this.subdomainParams,
        predictiveModelsCollection: predictiveModelsCollection,
        predictiveModel: activePredictiveModel,
        layers: layersCollection
      });

      //No Layer list nor legend are showed into journey embed map.
      if (!journeyMap) {
        var layersListView = new root.app.View.LayersList({
          el: '#layersListView',
          layers: layersCollection,
          subdomainParams: this.subdomainParams
        });

        var predictiveModelView = new root.app.View.PredictiveModels({
          el: '#modelContent',
          collection: predictiveModelsCollection,
          model: activePredictiveModel,
          router: this.router
        });

        var legendView = new root.app.View.Legend({
          el: '#legendView',
          layers: layersCollection,
          model: new (Backbone.Model.extend({
            defaults: {
              hidden: false,
              order: []
            }
          })),
          predictiveModel: activePredictiveModel
        });
      }

      // Fetching data
      var complete = _.invoke([
        layersGroupsCollection,
        layersCollection
      ], 'fetch');

      $.when.apply($, complete).done(function() {

        // Checking routes and setting actived layers
        var routerParams = _.isEmpty(this.router.params.attributes);
        if (!routerParams && this.router.params.attributes.layers) {
          var activedLayers = JSON.parse(this.router.params.attributes.layers);
          var activedLayersIds = _.pluck(activedLayers, 'id');
          _.each(layersCollection.models, function(model) {
            var routerLayer = _.findWhere(activedLayers, { id: model.id });
            var active = _.contains(activedLayersIds, model.id);
            var layerData = { active: active };
            if (routerLayer) {
              layerData.opacity = routerLayer.opacity;
              layerData.order = routerLayer.order;
            }
            model.set(layerData, { silent: true });
          });
          layersCollection.sort();
        } else if (routerParams) {
          var data = layersCollection.getActived();
          this.router.setParams('layers', data, ['id', 'opacity', 'order']);
        }

        // Updating URL when layers collection change
        layersCollection.on('change', function() {
          var data = layersCollection.getActived();
          this.router.setParams('layers', data, ['id', 'opacity', 'order']);
        }.bind(this));

        // Attach groups to layers collection
        layersCollection.setGroups(layersGroupsCollection);

        // Render views
        mapView.renderLayers();
        //Layer list is not showed into journey embed map.
        if (!journeyMap) {
          layersListView.render();
          legendView.render();
        }

        var socialShare = new root.app.View.Share({
          'map': mapView,
          layers: layersCollection
        });

        if (!journeyMap) {
          var searchView = new root.app.View.Search({
            el: '#toolbarView',
            map: mapView
          });
        }

      }.bind(this));
    },

    _checkJourneyMap: function() {
      return $('body').hasClass('is-journey-map');
    },


  });

})(this);
