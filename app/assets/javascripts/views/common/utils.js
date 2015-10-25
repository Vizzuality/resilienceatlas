(function(root) {

  'use strict';

  root.app = root.app || {};
  root.app.View = root.app.View || {};

  root.app.View.Utils = Backbone.View.extend({

  /**
   * Check mobile device
   */
  function isMobile() {
    return !!navigator.userAgent.match(/iPad|iPhone|iPod|Android|BlackBerry|webOS/i) ||
      window.innerWidth <= 540; // Better use screen.width
  }

  function isTablet() {
    return !!navigator.userAgent.match(/iPad|iPhone|iPod|Android|BlackBerry|webOS/i) &&
      (screen.width > 540 && screen.width <= 1280);
  }

  });

})(this);