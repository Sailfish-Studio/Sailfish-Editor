/**
 * A debug "index" module exporting VideoMotion and VideoMotionView to debug
 * VideoMotion directly.
 * @file debug.js
 */

const VideoMotion = require('./library');
const VideoMotionView = require('./view');

if (typeof module !== "undefined") module.exports = {
    VideoMotion,
    VideoMotionView
};
