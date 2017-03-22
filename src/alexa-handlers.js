"use strict";

const Promise = require('promise');
const { APP_SOURCE } = require('./ai-config-appSource.js');
const Db = require('./db.js');

const { busDirectionFromInput } = require('./ai-config-busDirection.js');
const {
  reportMyLocation,
  reportMyLocationUpdate,
  reportNearestStopResult
} = require('./common-assistant.js');

// Alexa doesn't like ampersands in SSML
function cleanResponse(response) {
  return response.replace(/&/g, 'and');
}

function handleGetMyLocation(request, response) {
  const userId = request.sessionDetails.userId;

  // TODO handle errors
  return new Promise(resolve => {
    reportMyLocation(APP_SOURCE.ALEXA, userId, responseText => {
      resolve(responseText);
    });
  }).then(responseText => {
    response.say(responseText);
  });
}

function handleUpdateMyLocation(request, response) {
  const userId = request.sessionDetails.userId;
  const address = request.slot('address');

  // TODO handle errors
  return new Promise(resolve => {
    reportMyLocationUpdate(APP_SOURCE.ALEXA, userId, address, responseText => {
      resolve(responseText);
    });
  }).then(responseText => {
    response.say(responseText);
  });
}

function handleNearestBusTimesByRoute(request, response) {
  const userId = request.sessionDetails.userId;

  const busRoute = request.slot("busRoute");
  const busDirection = busDirectionFromInput(
    request.slot("busDirection")
  );

  // TODO add requestContext
  const alexaDb = Db.forRequest(APP_SOURCE.ALEXA, userId);

  // TODO handle errors
  return alexaDb.getLocation().then(location => {
    return new Promise(resolve => {
      if (location) {
        reportNearestStopResult(APP_SOURCE.ALEXA, userId, location, busRoute, busDirection, function(responseText) {
          resolve(responseText);
        });
      } else {
        resolve('You have not set your location yet. You can set one by saying "Update my location".');
      }
    });
  }).then(function(responseText) {
    response.say(cleanResponse(responseText));
  });
}

function handleDefault(request, response) {
  const userId = request.sessionDetails.userId;

  // TODO add requestContext
  const alexaDb = Db.forRequest(APP_SOURCE.ALEXA, userId);

  return alexaDb.getLocation().then(location => {
    const baseResponse = 'Hello there! I can look up bus times for you. For example you can say, "When is the next 12 to downtown?"';
    const noLocationResponse = `${baseResponse}. But first, you'll need to tell me your location by saying "Set my location".`;

    const responseText = location ? baseResponse : noLocationResponse;
    response.say(cleanResponse(responseText));
  });
}

module.exports = {
  handleGetMyLocation,
  handleUpdateMyLocation,
  handleNearestBusTimesByRoute,
  handleDefault
};
