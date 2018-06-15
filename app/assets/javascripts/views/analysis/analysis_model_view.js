(function(root) {
  'use strict';

  root.app = root.app || {};
  root.app.View = root.app.View || {};

  // Accepted extensions for the shape upload
  var ACCEPTED_EXTENSIONS = ['.json', '.geojson'];

  root.app.View.analysisModel = Backbone.View.extend({
    el: '#analysisSelectorsView',

    template: HandlebarsTemplates['analysis/analysis_model_tpl'],

    events: {
      'click .js-tabs': 'onClickTab',
      'click .js-toggle-draw': 'onClickToggleDraw',
      'click .js-pick-file': 'onClickPickFile',
      'dragover .js-pick-file': 'onDragStartFile',
      'dragleave .js-pick-file': 'onDragEndFile',
      'drop .js-pick-file': 'onDropFile',
      'click .js-reset': 'onClickReset'
    },

    initialize: function() {
      this.state = new Backbone.Model({
        tab: 'region',
        drawing: false,
        geojson: null
      });

      this.setListeners();
      this.render();
    },

    /**
     * Set the listeners that aren't attached to a
     * DOM node
     */
    setListeners: function() {
      this.listenTo(this.state, 'change', this.render.bind(this));
      this.listenTo(Backbone.Events, 'map:polygon:created', this.onCreatePolygon.bind(this));
    },

    /**
     * Event handler executed when the user clicks a tab
     * NOTE: the event is attached to the parent
     * @param {MouseEvent} e Event
     */
    onClickTab: function(e) {
      var tab = e.target.getAttribute('data-tab');
      this.state.set({
        tab: tab,
        drawing: false,
        geojson: null
      });
      Backbone.Events.trigger('map:draw:disable');
      Backbone.Events.trigger('map:draw:reset');
    },

    /**
     * Event handler executed when the user clicks the
     * draw button
     */
    onClickToggleDraw: function() {
      if (this.state.get('drawing')) {
        Backbone.Events.trigger('map:draw:disable');
        Backbone.Events.trigger('map:draw:reset');
      } else {
        Backbone.Events.trigger('map:draw:enable');
      }

      this.state.set({
        drawing: !this.state.get('drawing'),
        geojson: this.state.get('drawing')
          ? this.state.get('geojson')
          : null
      });
    },

    /**
     * Event handler executed when the user creates a
     * polygon on the map
     * @param {object} geojson GeoJSON representing the polygon
     */
    onCreatePolygon: function(geojson) {
      this.state.set({
        drawing: false,
        geojson: geojson
      });
    },

    /**
     * Event handler executed when the user clicks the
     * button to pick a file
     */
    onClickPickFile: function() {
      var input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', ACCEPTED_EXTENSIONS.join(','));

      input.addEventListener('change', function() {
        var file = input.files[0];
        this.readGeojson(file);
      }.bind(this));

      input.click();
    },

    /**
     * Event handler executed when the user clicks the
     * reset button
     */
    onClickReset: function() {
      this.state.set({ geojson: null });
      Backbone.Events.trigger('map:draw:reset');
    },

    /**
     * Event handler executed when the user starts to
     * drag a file over the drop zone
     * @param {Event} e Event
     */
    onDragStartFile: function(e) {
      e.preventDefault();
      e.stopPropagation();

      /** @type {HTMLElement} button */
      var button = e.target;
      button.classList.add('-active');

      // We indicate to the user where to drop the file
      if (!this.previousPickFileButtonContent) {
        this.previousPickFileButtonContent = button.textContent;
        button.textContent = 'Drop here';
      }
    },

    /**
     * Event handler executed when the user stops to
     * drag a file over the drop zone
     * @param {Event} e Event
     */
    onDragEndFile: function(e) {
      e.preventDefault();
      e.stopPropagation();

      /** @type {HTMLElement} button */
      var button = e.target;
      button.classList.remove('-active');

      // We restore the content of the button
      if (this.previousPickFileButtonContent) {
        button.textContent = this.previousPickFileButtonContent;
        this.previousPickFileButtonContent = null;
      }
    },

    /**
     * Event handler executed when the user drops a file
     * in the drop zone
     * @param {Event} e Event
     */
    onDropFile: function(e) {
      this.onDragEndFile(e);

      var file = e.originalEvent.dataTransfer.files[0];
      this.readGeojson(file);
    },

    /**
     * Event handler executed when the user selects a country
     * @param {string} iso ISO of the country
     * @param {string} country Name of the country
     * @param {string} bbox Feature of a GeoJSON
     */
    onSelectCountry: function(iso, country, bbox) {
      var geojson  = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: JSON.parse(bbox)
          }
        ]
      };

      this.state.set({ geojson: geojson });

      Backbone.Events.trigger('map:draw:reset');
      Backbone.Events.trigger('map:draw:polygon', geojson);
    },

    /**
     * Check if the file is has GeoJSON format
     * and update the UI consequently
     * @param {File} file File
     */
    readGeojson: function(file) {
      var regex = new RegExp('((' + ACCEPTED_EXTENSIONS.join('|') + '))$');
      if (!regex.test(file.name)) {
        window.alert('Only .json and .geojson files are accepted. Please select a different file.')
        return;
      }

      var reader = new FileReader();

      reader.addEventListener('load', function(e) {
        try {
          var json = JSON.parse(e.target.result);

          // Simple check to validate the format of the file
          var types = ['Feature', 'FeatureCollection', 'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon', 'GeometryCollection'];
          if (!json.type || types.indexOf(json.type) === -1) {
            throw new Error('The file doesn\'t have a top-level "type" property correctly defined.');
          }

          this.state.set({
            geojson: json,
            drawing: false
          });

          Backbone.Events.trigger('map:draw:disable');
          Backbone.Events.trigger('map:draw:reset');
          Backbone.Events.trigger('map:draw:polygon', json);
        } catch(e) {
          console.error(e);
          window.alert('The file can\'t be read. Make sure it\'s the GeoJSON is valid.');
        }
      }.bind(this));

      reader.readAsText(file);
    },

    render: function() {
      this.$el.html(this.template(this.state.attributes));

      if (this.state.attributes.tab === 'region') {
        this.searchView = new root.app.View.Search({
          el: '#analysisSelectorsView',
          elContent: '.analysisSearchContent',
          elInput: '.searchAnalysis',
          elSearchParent: '#analysisSelectorsView',
          closeOnClick: false,
          triggerMap: false
        });

        this.listenTo(this.searchView, 'selected', this.onSelectCountry);
      } else {
        this.searchView = null;
      }
    },

    /**
     * Destroy the view
     * Same as remove but without removing the node
     */
    destroy: function() {
      this.$el.html('');
    }
  });

})(this);