//= require jquery
//= require jquery_ujs
//= require jquery-ui/sortable
//= require jquery-ui-touch-punch-valid
//= require underscore
//= require backbone
//= require handlebars
//= require slick-carousel
//= require foundation
//= require d3

//= require ./helpers/handlebars_helpers
//= require ./helpers/class
//= require ./helpers/cartodb_layer
//= require ./helpers/cartodb_raster
//= require ./helpers/cartodb_mask
//= require ./helpers/charts
//= require_tree ./models
//= require_tree ./collections
//= require_tree ./templates
//= require ./views/mapPageView
//= require ./views/staticPageView
//= require ./views/journeysPageView
//= require_tree ./views/common
//= require_tree ./views/map
//= require_tree ./views/journeys
//= require ./views/analysis/widgets/widget_view
//= require ./views/analysis/widgets/widget_bar_chart
//= require ./views/analysis/widgets/widget_group_bar_chart
//= require ./views/analysis/widgets/widget_group_horizontal_bar_chart
//= require ./views/analysis/widgets/widget_pyramid_chart
//= require ./views/analysis/widgets/widget_line_chart
//= require ./views/analysis/widgets/widget_number
//= require ./views/analysis/widgets/widget_text_list
//= require ./views/analysis/analysis_page_view
//= require ./views/analysis/analysis_selectors_view

//= require router

(function(root) {

  'use strict';

  /**
   * Provide top-level namespaces for our javascript.
   * @type {Object}
   */
  root.app = root.app || {
    Model: {},
    Collection: {},
    View: {},
    Helper: {}
  };

  /**
   * Main Application View
   */
  root.app.AppView = Backbone.View.extend({

    /**
     * Main DOM element
     * @type {Object}
     */
    el: document.body,

    initialize: function() {
      this.currentViews = [];
      this.router = new root.app.Router();
      this.initGlobalViews();
      this.setListeners();
    },

    setListeners: function() {
      this.listenTo(this.router, 'route:welcome', this.welcomePage);
      // Initializing map
      this.listenTo(this.router, 'route:map', this.mapPage);
      // Initializing journeys
      this.listenTo(this.router, 'route:journeys', this.journeysPage);
      // Initializing journeys
      this.listenTo(this.router, 'route:about', this.aboutPage)
    },

    initGlobalViews: function() {
      var journeysIndexCollection = new root.app.Collection.JourneysIndex();
      var headerView = new root.app.View.Header({
        el: '#headerView',
        journeys: journeysIndexCollection
      });

      // Fetching data
      var complete = _.invoke([
        journeysIndexCollection,
      ], 'fetch');

      $.when.apply($, complete).done(function() {
        headerView.render();
        this.totalJourneys = journeysIndexCollection.length;
      }.bind(this));
    },

    welcomePage: function() {
      var sliderView = new root.app.View.Slider({
        el: '#sliderView'
      });
    },

    mapPage: function() {
      var mapPageView = new root.app.MapPageView({
        router: this.router,
      });
    },

    journeysPage: function(journeyId) {
      var journeyPageView = new root.app.JourneysPageView({
        router: this.router,
        options: {
          'journeyId': journeyId,
          'totalJourneys': this.totalJourneys
        }
      });
    },

    aboutPage: function() {
      new root.app.View.StaticPageView;
    },

    start: function() {
      Backbone.history.start({ pushState: true });
    }
  });

  new app.AppView().start();

})(this);
