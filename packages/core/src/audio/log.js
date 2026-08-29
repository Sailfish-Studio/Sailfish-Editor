const nanolog = require('@sailfish/shared');
nanolog.enable();

if (typeof module !== "undefined") module.exports = nanolog('scratch-audioengine');
