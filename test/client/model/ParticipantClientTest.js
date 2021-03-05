const { expect } = require('chai');
const TestUtil = require('../../server/models/utils/TestUtil.js');
const Direction = require('../../../src/game/app/client/shared/Direction.js');
const PositionClient = require('../../../src/game/app/client/models/PositionClient.js');
const ParticipantClient = require('../../../src/game/app/client/models/ParticipantClient.js');

var id;
var forename;
var position;
var direction;
var isVisible;
var isModerator;
var ppant;

describe('ParticipantClient test', function () {

    //test data
    beforeEach(function () {
        id = TestUtil.randomString();
        forename = TestUtil.randomString();
        position = new PositionClient(TestUtil.randomInt(), TestUtil.randomInt());
        direction = Direction.DOWNLEFT;
        isVisible = TestUtil.randomBool();
        isModerator = TestUtil.randomBool();
        ppant = new ParticipantClient(id, forename, position, direction, isVisible, isModerator);
    });

    it('test getters', function () {
        expect(ppant.getId()).to.be.a('string').and.to.equal(id);
        expect(ppant.getForename()).to.be.a('string').and.to.equal(forename);
        expect(ppant.getPosition()).to.be.instanceOf(PositionClient).and.to.equal(position);
        expect(ppant.getDirection()).to.equal(direction);
        expect(ppant.getIsVisible()).to.equal(isVisible);
        expect(ppant.getIsModerator()).to.equal(isModerator);
    });

    it('test set new valid position', function () {
        let newPosition = new PositionClient(TestUtil.randomInt(), TestUtil.randomInt());
        ppant.setPosition(newPosition);
        expect(ppant.getPosition()).to.be.instanceOf(PositionClient).and.to.equal(newPosition);
    });

    it('test set new valid direction', function () {
        let newDirection = Direction.DOWNRIGHT;
        ppant.setDirection(newDirection);
        expect(ppant.getDirection()).to.equal(newDirection);
    });

    it('test set valid isVisible', function () {
        let newIsVisible = !ppant.getIsVisible();
        ppant.setisVisible(newIsVisible);
        expect(ppant.getIsVisible()).to.equal(newIsVisible);
    });

    it('test set valid isModerator', function () {
        let newIsModerator = !ppant.getIsModerator();
        ppant.setIsModerator(newIsModerator);
        expect(ppant.getIsModerator()).to.equal(newIsModerator);
    });

    it('test set new invalid position', function () {
        expect(() => ppant.setPosition('newPosition')).to.throw(TypeError);
    });

    it('test set new invalid direction', function () {
        expect(() => ppant.setDirection('newDirection')).to.throw(TypeError);
    });

    it('test set invalid isVisible', function () {
        expect(() => ppant.setisVisible('isVisible')).to.throw(TypeError);
    });

    it('test set invalid isModerator', function () {
        expect(() => ppant.setisModerator('isModerator')).to.throw(TypeError);
    });
});