/*global alert, document, window, ActiveXObject, init, console, XMLHttpRequest, SB, Notification */
/*jslint white: true, evil: true */
/*jshint -W020 */

/**
 * Copyright (c) 2014 brian@bevey.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

SB = (function () {
  'use strict';

  return {
    version : 201401016,

   /**
    * Stops event bubbling further.
    *
    * @param {Event} e Event to prevent from bubbling further.
    */
    cancelBubble : function (e) {
      e = e || window.event;

      e.cancelBubble = true;

      if (e.stopPropagation) {
        e.stopPropagation();
      }
    },

   /**
    * Determines if an element is an ancestor to another element.
    *
    * @param {Object} child DOM element to check if it is an ancestor of the
    *         ancestor element passed.
    * @param {Object} ancestor DOM element of potential ancestor node to the
    *         child element passed.
    * @return {Boolean} true if the child is an ancestor of the ancestor
    *          element passed - false, otherwise.
    */
    isChildOf : function (child, ancestor) {
      if (ancestor === child) {
        return false;
      }

      while (child && (child !== ancestor) && (child !== document.body)) {
        child = child.parentNode;
      }

      return child === ancestor;
    },

    event : {
      list : [],

     /**
      * Handles event attachment via the best method availalbe.
      *
      * @param {Object} elm Element to have the event attached to.
      * @param {String} event Event to trigger.  Options include all standard
      *         events, minus the "on" prefix (ex: "click", "dblclick", etc).
      *         Additionally, "mouseenter" and "mouseleave" are supported.
      * @param {Function} action Function to be executed when the given event
      *         is triggered.
      * @param {Boolean} capture true if the event should be registered as a
      *         capturing listener.  Defaults to false.
      * @note All events are added to the SB.event.list array for access outside
      *        this function.
      */
      add : function (elm, event, action, capture) {
        capture = capture || false;

        if (elm.addEventListener) {
          elm.addEventListener(event, action, capture);
        }

        else if (elm.attachEvent) {
          elm.attachEvent('on' + event, action);
        }

        else {
          elm['on' + event] = action;
        }

        SB.event.list.push([elm, event, action]);
      },

     /**
      * Removes events attached to a given element.
      *
      * @param {Object} elm Element to have the event removed from.
      * @param {String} event Event to trigger.  Options include all standard
      *         events, minus the "on" prefix (ex: "click", "dblclick", etc).
      * @param {Function} action Function to be removed from the given element
      *         and event.
      * @param {Boolean} capture true if the event was registered as a
      *         capturing listener.  Defaults to false.
      * @note Automatically removes the event from the SB.event.list array
      */
      remove : function (elm, event, action, capture) {
        capture = capture || false;

        var i = 0;

        if (elm.removeEventListener) {
          elm.removeEventListener(event, action, capture);
        }

        else if (elm.detachEvent) {
          elm.detachEvent('on' + event, action);
        }

        else {
          elm['on' + event] = null;
        }

        for (i; i < SB.event.list.length; i += 1) {
          if (SB.event.list[i]) {
            if ((SB.event.list[i]) &&
                (SB.event.list[i][0] === elm) &&
                (SB.event.list[i][1] === event) &&
                (SB.event.list[i][2] === action)) {
              SB.event.list.splice(i, 1);

              break;
            }
          }
        }
      },

     /**
      * Loops through all registered events (referencing the
      *  SB.event.list array) and removes all events.  This should only be
      *  executed onunload to prevent documented IE6 memory leaks.
      */
      removeAll : function (elm) {
        elm = elm || document;

        var i = SB.event.list.length - 1;

        for (i; i >= 0; i -= 1) {
          if (SB.event.list[i]) {
            if ((SB.event.list[i][0] === elm) || (elm === document)) {
              SB.event.remove(SB.event.list[i][0], SB.event.list[i][1], SB.event.list[i][2]);
            }
          }
        }
      }
    },

   /**
    * Shortcut function used to quickly find the target of an event (used in
    *  event delegation).
    *
    * @param {Event} e Event to determine the target of.
    * @return {Object} Element that was the target of the specified event.
    */
    getTarget : function (e) {
      e = e || window.event;

      if (e.target) {
        return e.target;
      }

      else {
        return e.srcElement;
      }
    },

   /**
    * Looks for a given attribute with a specified value within the given
    *  element.
    *
    * @param {Object} elm Element to check for a given attribute.
    * @param {String} attribute Attribute being checked.
    * @param {String} value Value of the attribute specifically being checked.
    * @return {Boolean} true if the given attribute and value is found within
    *          the element.
    */
    hasAttribute : function (elm, attribute, value) {
      if (elm[attribute]) {
        return elm[attribute].match(new RegExp('(\\s|^)' + value + '(\\s|$)')) ? true : false;
      }
    },

   /**
    * Sugar function used to find if a given element has the 'className'
    *  attribute specified.
    *
    * @param {Object} elm Element to check for a given class name.
    * @param {String} className Class name being checked.
    */
    hasClass : function (elm, className) {
      return SB.hasAttribute(elm, 'className', className) ? true : false;
    },

   /**
    * Add the specified class to the given element - but only if it does not
    *  already have the class.
    *
    * @param {Object} elm Element to apply the given class to.
    * @param {String} className Class name to be applied.
    */
    addClass : function (elm, className) {
      if (!SB.hasClass(elm, className)) {
        elm.className = SB.trim(elm.className + ' ' + className);
      }
    },

   /**
    * Removes the specified class from the given element.
    *
    * @param {Object} elm Element to remove the given class from.
    * @param {String} className Class name to be removed.
    */
    removeClass : function (elm, className) {
      if (SB.hasClass(elm, className)) {
        elm.className = elm.className.replace(new RegExp('(\\s|^)' + className + '(\\s|$)'), ' ');
        elm.className = SB.trim(elm.className);
      }
    },

   /**
    * Sugar function used to add or remove a class from a given element -
    *  depending on if it already has the class applied.
    *
    * @param {Object} elm Element to have the class toggled.
    * @param {String} className Class Name to be toggled.
    */
    toggleClass : function (elm, className) {
      if (!SB.hasClass(elm, className)) {
        SB.addClass(elm, className);
      }

      else {
        SB.removeClass(elm, className);
      }
    },

   /**
    * Sugar function used to set the passed element to the currently focused
    * element.
    *
    * @param {Object} elm Element to be focused.
    */
    setFocus : function (elm) {
      if(typeof elm.setActive === 'function') {
        elm.setActive();
      }

      else if(typeof elm.focus === 'function') {
        elm.focus();
      }
    },

    /**
     * Shortcut to document.getElementById
     *
     * @param {String} ID name to be searched for.
     */
    get : function (id) {
      return document.getElementById(id);
    },

    /**
     * Shortcut to document.getElementsByTagName
     * @param {String} tagName Tag name to be searched for.
     * @param {Object} parent Parent element to begin the search from.  If no
     *                 element is specified, the document root will be used.
     */
    getByTag : function (tagName, parent) {
      parent = parent || document;

      return parent.getElementsByTagName(tagName);
    },

   /**
    * Finds all elements with the given class name.  Optionally, a tag name can
    *  specified to further refine an element search.
    *
    * @param {String} className Class name to be searched for.
    * @param {Object} parent Parent element to begin the search from.  If no
    *         element is specified, the document root will be used.
    * @param {String} tag Optionally, you may specify a tag name to further
    *         filter.
    * @return {Array} Returns an array of elements matching the entered
    *          criteria.
    * @note Uses native getElementsByClassName if available.
    */
    getByClass : function (className, parent, tag) {
      var elementsWithClass = [],
          children = [],
          i = 0,
          j = 0;

      parent = parent || document;
      tag    = tag.toLowerCase() || '*';

      if ((tag === '*') && (document.getElementsByClassName)) {
        return parent.getElementsByClassName(className);
      }

      if (parent.getElementsByClassName) {
        children = parent.getElementsByClassName(className);

        if (tag && children.length) {
          for (i in children) {
            if ((children[i].tagName) && (children[i].tagName.toLowerCase() === tag)) {
              elementsWithClass[j] = children[i];
              j += 1;
            }
          }
        }

        else {
          elementsWithClass = children;
        }
      }

      else {
        children = SB.getByTag(tag, parent);

        for (i in children) {
          if (SB.hasClass(children[i], className)) {
            elementsWithClass[j] = children[i];
            j += 1;
          }
        }
      }

      return elementsWithClass;
    },

   /**
    * Retrieves text from a given element, using the best method available.
    *
    * @param {Object} elm Element to have text retrieved from.
    */
    getText : function (elm) {
      if (elm.textContent) {
        return elm.textContent;
      }

      else if (elm.innerText) {
        return elm.innerText;
      }

      else if (elm.text) {
        return elm.text;
      }

      else {
        return elm.innerHTML;
      }
    },

   /**
    * Enters text into a given element, using the best method available.  If
    *  text already exists within the element, it will be overwritten.
    *
    * @param {Object} elm Element to have text entered into.
    * @param {String} text Text that will populate the element.
    */
    putText : function (elm, text) {
      if (elm.textContent) {
        elm.textContent = text;
      }

      else if (elm.innerText) {
        elm.innerText = text;
      }

      else if (elm.text) {
        elm.text = text;
      }

      else {
        elm.innerHTML = text;
      }
    },

   /**
    * Sugar function to remove units of measure from a given string.
    *
    * @param {String} property Measurement property to have it's units removed.
    * @return {Integer} Integer value of measurement entered - but without
    *          units of measure.
    */
    stripUnits : function (property) {
      var value = '';

      if (typeof property === 'string') {
        value = parseInt(property.replace(new RegExp('(%|px|em)'), ''), 10);
      }

      else {
        value = property;
      }

      return value;
    },

   /**
    * Removes extra whitespace at the beginning or end of a given string.
    *
    * @param {String} string String of text that may have leading or trailing
    *         whitespace.
    * @return {String} String of text with leading or trailing whitespace
    *          removed.
    */
    trim : function (string) {
      string = string || '';

      return string.toString().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    },

    /**
     * Log messages.  If you pass a source and type (success, info or error),
     * it will print to console with pretty colors.
     *
     * @param {String|Object} message Message to be printed to console log.
     * @param {String} source Source of the log - a device or function worth
     *         noting.
     * @param {String} type Type of message to log - defines the color of the
     *         text.  Can be "success", "info" or "error".
     */
    log : function (message, source, type) {
      var now   = new Date(),
          color = 'color: white';

      if((typeof console === 'object') && (typeof console.log === 'function')) {
        if((source) && (typeof message !== 'object')) {
          message = '%c' + source + '%c: ' + message + ' (' + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ')';

          switch(type) {
            case 'success' :
              color = 'color: green';
            break;

            case 'info' :
              color = 'color: aqua';
            break;

            case 'error' :
              color = 'color: red';
            break;
          }

          console.log(message, 'background: black; ' + color, 'background: black; color: white');
        }

        else {
          console.log(message);
        }
      }

      else {
        alert(message);
      }
    },

    /**
     * Stupid wrapper to ensure navigator.vibrate exists before using it.
     *
     * @param {Int} duration Number of milliseconds to vibrate.
     */
    vibrate : function (duration) {
      duration = duration || 5;

      if((window.navigator) && (window.navigator.vibrate)) {
        window.navigator.vibrate(duration);
      }
    },

   /**
    * Finds the computed value of a given CSS property.
    *
    * @param {Object} elm Element containing a CSS property.
    * @param {String} property CSS property of the element to be found.
    * @return {String} Computed CSS property value of the given element and
    *          property type.
    */
    findStyle : function (elm, property) {
      var styleValue = '';

      if (elm.currentStyle) {
        property = property.replace(/-\w/g, function (match) {
          return match.charAt(1).toUpperCase();
        });

        styleValue = elm.currentStyle[property];
      }

      else if (window.getComputedStyle) {
        styleValue = document.defaultView.getComputedStyle(elm, null).getPropertyValue(property);
      }

      else {
        return 0;
      }

      if (styleValue) {
        if ((styleValue.indexOf('px') !== -1) ||
            (styleValue.indexOf('em') !== -1) ||
            (styleValue.indexOf('%')  !== -1)) {
          styleValue = SB.stripUnits(styleValue);
        }

        if (property === 'opacity') {
          styleValue = parseFloat(styleValue, 10);
        }
      }

      return styleValue;
    },

    spec : {
      elms : {},

      accuracy : 0,

      deviceOrientation : 'landscape',

      vors : { kpae : { latitude : 47.9070000, longitude : -122.2815833 },
               ksmo : { latitude : 34.0158333, longitude : -118.4513056 } },

      //////////////////////////////////////////////////////////////////////////
      // Build interfaces
      //////////////////////////////////////////////////////////////////////////
      buildClock : function () {
        var container = document.createElement('span'),
            clock     = document.createElement('time');

        SB.get('clock').innerHTML = '';
        container.appendChild(clock);
        SB.get('clock').appendChild(container);
        SB.spec.elms.clock = clock;
      },

      buildSpeed : function () {
        var speed      = document.createElement('h5'),
            indicators = document.createElement('ol');

        indicators.innerHTML = '<li>0</li><li>20</li><li>40</li><li>60</li><li>80</li><li>100</li><li>120</li><li>140</li><li>160</li><li>180</li><li>200</li>';
        SB.get('speed').innerHTML = '';
        SB.get('speed').appendChild(speed);
        SB.get('speed').appendChild(indicators);
        SB.spec.elms.speed = speed;
      },

      buildAttitude : function () {
        var ground;

        if(window.DeviceOrientationEvent) {
          ground = document.createElement('ground');
          ground.className = 'ground';
          SB.putText(ground, 'Ground');

          SB.get('attitude').innerHTML = '';
          SB.get('attitude').appendChild(ground);

          SB.spec.elms.attitude = ground;
        }
      },

      buildAltitude : function () {

      },

      buildCompass : function () {
        var needle     = document.createElement('h5'),
            indicators = document.createElement('ol'),
            compass    = SB.get('compass');

        indicators.innerHTML = '<li>N</li><li>3</li><li>6</li><li>E</li><li>12</li><li>15</li><li>S</li><li>21</li><li>24</li><li>W</li><li>30</li><li>33</li>';
        compass.innerHTML = '';
        compass.appendChild(needle);
        compass.appendChild(indicators);
        SB.spec.elms.compass = indicators;
      },

      buildTurn : function () {

      },

      buildHeading : function () {
        var needle     = document.createElement('h5'),
            indicators = document.createElement('ol'),
            heading    = SB.get('heading');

        indicators.innerHTML = '<li>N</li><li>3</li><li>6</li><li>E</li><li>12</li><li>15</li><li>S</li><li>21</li><li>24</li><li>W</li><li>30</li><li>33</li>';
        heading.innerHTML = '';
        heading.appendChild(needle);
        heading.appendChild(indicators);
        SB.spec.elms.heading = indicators;
      },

      buildVertical : function () {

      },

      buildGMeter : function () {
        var gmeter     = document.createElement('h5'),
            indicators = document.createElement('ol');

        indicators.innerHTML = '<li>10</li><li>9</li><li>8</li><li>7</li><li>6</li><li>5</li><li>4</li><li>3</li><li>2</li><li>1</li><li>0</li><li>-1</li><li>-2</li><li>-3</li><li>-4</li><li>-5</li><li>-6</li>';
        SB.get('gmeter').innerHTML = '';
        SB.get('gmeter').appendChild(gmeter);
        SB.get('gmeter').appendChild(indicators);
        SB.spec.elms.gmeter = gmeter;
      },

      buildVORDME : function() {

      },

      //////////////////////////////////////////////////////////////////////////
      // Updates to interfaces
      //////////////////////////////////////////////////////////////////////////
      changeClock : function (time) {
        SB.putText(SB.spec.elms.clock, time);
      },

      changeSpeed : function (speed) {
        var rotation = (speed / 240) * 360;

        if(rotation < 0) {
          rotation = 0;
        }

        else if(rotation > 360) {
          rotation = 360;
        }

        SB.spec.elms.speed.style.transform = 'rotate(' + rotation + 'deg)';
        SB.putText(SB.spec.elms.speed, speed);
      },

      changeAttitude : function (pitch, roll) {
        var top = 50;

        SB.spec.elms.attitude.style.transform = 'rotate(' + roll + 'deg)';
        SB.spec.elms.attitude.style.top = ((pitch * -1) + 50) + '%';
      },

      changeAltitude : function (altitude) {

      },

      changeCompass : function (direction) {
        SB.spec.elms.compass.style.transform = 'rotateY(' + direction + 'deg)';
      },

      changeTurn : function (direction, heading) {

      },

      changeHeading : function (heading) {
        SB.spec.elms.heading.style.transform = 'rotate(' + heading + 'deg)';
      },

      changeVertical : function (altitude) {

      },

      changeGMeter : function (forcePos, forceNeg) {
        var force  = Math.abs(forceNeg) > forcePos ? forceNeg : forcePos,
            rotate = -90;

        force = force - 1;

        if(force > 10) {
          force = 10;
        }

        else if(force < -6) {
          force = -6;
        }

        rotate = rotate + (22.5 * force);

        SB.spec.elms.gmeter.style.transform = 'rotate(' + rotate + 'deg)';
      },

      changeVORDME : function (distance, bearing) {

      },

      //////////////////////////////////////////////////////////////////////////
      // Generic math and sensor functions
      //////////////////////////////////////////////////////////////////////////
      // http://stackoverflow.com/a/21623206
      distance : function (lat1, lon1, lat2, lon2) {
        var R = 3959,
            a = 0.5 - Math.cos((lat2 - lat1) * Math.PI / 180)/2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * (1 - Math.cos((lon2 - lon1) * Math.PI / 180)) / 2;

        return R * 2 * Math.asin(Math.sqrt(a));
      },

      // http://gis.stackexchange.com/a/48911
      bearing : function (lat1, lon1, lat2, lon2) {
        var dLong,
            dPhi,
            radians = function (n) {
              return n * (Math.PI / 180);
            },
            degrees = function (n) {
              return n * (180 / Math.PI);
            };

        lat1 = radians(lat1);
        lon1 = radians(lon1);
        lat2 = radians(lat2);
        lon2 = radians(lon2);

        dLong = lon2 - lon1;

        dPhi = Math.log(Math.tan(lat2/2.0+Math.PI/4.0)/Math.tan(lat1/2.0+Math.PI/4.0));

        if (Math.abs(dLong) > Math.PI){
          if (dLong > 0.0) {
           dLong = -(2.0 * Math.PI - dLong);
          }

          else {
            dLong = (2.0 * Math.PI + dLong);
          }
        }

        return (degrees(Math.atan2(dLong, dPhi)) + 360.0) % 360.0;
      },

      orientation : function () {
        if(window.DeviceOrientationEvent) {
          SB.event.add(window, 'deviceorientation', function(e) {
            var alpha    = e.alpha           || '',
                beta     = e.beta            || '',
                gamma    = e.gamma           || '',
                compass  = e.compassHeading  || e.webkitCompassHeading  || alpha,
                accuracy = e.compassAccuracy || e.webkitCompassAccuracy || '',
                pitch    = '',
                roll     = '';

            if((!isNaN(alpha)) && (!isNaN(beta)) && (!isNaN(gamma))) {
              if(SB.spec.deviceOrientation === 'landscape') {
                roll  = beta * -1;

                compass = compass + 90;

                if(compass > 360) {
                  compass = compass - 360;
                }

                if(gamma > 0) {
                  // You're looking up
                  pitch = (90 - gamma) * -1;
                  roll  = roll + 180;
                }

                else {
                  // You're looking down
                  pitch = 90 + gamma;
                }

                SB.get('debug-orientation').value = "Landscape" +
//                                                    "\nAlpha: " + alpha +
                                                    "\nBeta:  " + beta +
                                                    "\nGamma: " + gamma +
                                                    "\nPitch: " + pitch +
                                                    "\nRoll:  " + roll;
              }

              else {
                pitch = (beta * -1) + 90;
                roll  = (gamma * -1);

                SB.get('debug-orientation').value = "Portrait" +
//                                                    "\nAlpha: " + alpha +
                                                    "\nBeta:  " + beta +
                                                    "\nGamma: " + gamma +
//                                                    "\nPitch: " + pitch +
                                                    "\nRoll:  " + roll;
              }

              SB.spec.changeAttitude(pitch, roll);
              SB.spec.changeCompass(compass);

              // If we don't have GPS lock, we'll use the compass bearing.
              if(SB.spec.gpsAccuracy === 0) {
// Compensate for orientation
                SB.spec.changeHeading(compass);
              }
            }
          });
        }
      },

      motion : function () {
        var hardestImpact = 0;

        if(window.DeviceMotionEvent) {
          SB.event.add(window, 'devicemotion', function(e) {
            var x, y, z,
                swivel = e.rotationRate.alpha,
                tilt   = e.rotationRate.beta,
                yaw    = e.rotationRate.gamma;

            // We prefer to use acceleration, as it implies you have a
            // hardware gyroscope available
            if(e.acceleration) {
              x = e.acceleration.x;
              y = e.acceleration.y;
              z = e.acceleration.z;
            }

            // If it is not available (and you likely do not have a
            // gyroscope), we'll fall back to the less accurate method.
            else if(e.accelerationIncludingGravity){
              x = e.accelerationIncludingGravity.x;
              y = e.accelerationIncludingGravity.y;
              z = e.accelerationIncludingGravity.z;
            }

            if((Math.max(x, y, z) > 5) || (Math.min(x,y,z) < -5)) {
              // You're abusing your phone!
              if((Math.max(x, y, z) > hardestImpact) || (Math.abs(Math.min(x, y, z)) > hardestImpact)) {
                hardestImpact = Math.max(x, y, z, Math.abs(Math.min(x, y, z)));
              }
            }

            SB.spec.changeGMeter(Math.max(x, y, z), Math.min(x, y, z));
/*
            SB.get('debug-motion').value = "x: " + Math.round(x) +
                                         "\ny: " + Math.round(y) +
                                         "\nz: " + Math.round(z) +
                                         "\nHardest Impact: " + Math.round(hardestImpact);
*/
          });
        }
      },

      location : function () {
        if(navigator.geolocation) {
          navigator.geolocation.watchPosition(function(pos) {
            var latitude  = pos.coords.latitude  || 0,
                longitude = pos.coords.longitude || 0,
                altitude  = pos.coords.altitude  || 0,
                heading   = pos.coords.heading   || 0,
                speed     = pos.coords.speed     || 0,
                accuracy  = pos.coords.accuracy  || 0;

            SB.spec.gpsAccuracy = (heading && altitude);

            if(isNaN(heading)) {
              heading = 0;
            }

            SB.spec.changeSpeed(speed);

            // If we have a GPS lock, we'll use the heading.  Otherwise, we'll
            // let orientation send compass bearing.
            if(heading) {
              SB.spec.changeHeading(heading);
            }

            SB.get('debug-location').value = "Latitude:  " + latitude +
                                           "\nLongitude: " + longitude +
                                           "\nAltitude:  " + altitude +
                                           "\nHeading:   " + heading +
                                           "\nSpeed:     " + speed +
                                           "\nAccuracy:  " + Math.round(accuracy);
          },
          function() {},
          { enableHighAccuracy : true });
        }
      },

      time : function () {
        var now    = new Date(),
            hour   = now.getHours(),
            minute = now.getMinutes(),
            second = now.getSeconds(),
            prefix;

        prefix = function(number) {
          if(number < 10) {
            number = '0' + number;
          }

          return number;
        };

        SB.spec.changeClock(hour + ':' + prefix(minute) + ':' + prefix(second));

        setTimeout(SB.spec.time, 1000);
      },

      camera : function () {
        var outputVideo = function (source) {
          navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

          if(navigator.getUserMedia) {
            navigator.getUserMedia({ video : { optional : [{sourceId : source}] }, audio : false }, function(stream) {
              var vid = SB.get('video')

              vid.src = window.URL.createObjectURL(stream);

              SB.event.add(vid, 'loadedmetadata', function(e) {

              });
            }, function(err) {
              SB.log('Video failed to load', 'Video', 'error');
            });
          }

          else {
            SB.log('No video available', 'Video', 'error');
          }
        };

        if(MediaStreamTrack) {
          MediaStreamTrack.getSources(function(sources) {
            var source = null,
                current,
                i;

            for(i = 0; i < sources.length; i += 1) {
              current = sources[i];

              if(current.kind === 'video') {
                source = current.id;
              }
            }

            outputVideo(source);
          });
        }
      },

      orientationChange : function () {
        var findOrientation;
        if(window.DeviceOrientationEvent) {
          findOrientation = function() {
            SB.spec.deviceOrientation = Math.abs(window.orientation) !== 90 ? 'portrait' : 'landscape';
          };

          findOrientation();

          SB.event.add(window, 'orientationchange', function(e) {
            findOrientation();
          });
        }
      },

      init : function () {
        SB.spec.orientationChange();
        SB.spec.buildClock();
        SB.spec.buildSpeed();
        SB.spec.buildAttitude();
        SB.spec.buildAltitude();
        SB.spec.buildCompass();
        SB.spec.buildTurn();
        SB.spec.buildHeading();
        SB.spec.buildVertical();
        SB.spec.buildGMeter();
        SB.spec.buildVORDME();

        SB.spec.orientation();
        SB.spec.motion();
        SB.spec.location();
        SB.spec.time();
        SB.spec.camera();
      }
    },

   /**
    * Initialization for SB.  Executes the standard functions used.
    */
    init : function () {
      if(SB.spec.init) {
        SB.spec.init();
      }

      SB.addClass(document.body, 'rich');
    }
  };
}());

if(document.addEventListener) {
  document.addEventListener('DOMContentLoaded', SB.init, false);
}

SB.event.add(window, 'load', function () {
  'use strict';

  if(!document.addEventListener) {
    SB.init();
  }
});

SB.event.add(window, 'unload', function () {
  'use strict';

  SB.event.removeAll();
});
