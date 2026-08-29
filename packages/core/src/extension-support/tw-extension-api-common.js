const ArgumentType = require('./argument-type');
const BlockType = require('./block-type');
const BlockShape = require('./tw-block-shape');
const TargetType = require('./target-type');
const Cast = require('../util/cast');
const external = require('./tw-external');

const Scratch = {
    ArgumentType,
    BlockType,
    BlockShape,
    TargetType,
    Cast,
    external
};

if (typeof module !== "undefined") module.exports = Scratch;
