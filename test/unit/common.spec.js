var expect = require('chai').expect;
require('../../lib/common.js');

describe('isPositiveInteger()', function () {

  it('should return true for positive integers', function () {
    expect(isPositiveInteger(1)).to.be.true;
    expect(isPositiveInteger(3000)).to.be.true;
    expect(isPositiveInteger(6e4)).to.be.true;
    expect(isPositiveInteger(9999999999)).to.be.true;
    expect(isPositiveInteger(Number.MAX_SAFE_INTEGER)).to.be.true;
  });

  it('should return false for negative integers', function () {
    expect(isPositiveInteger(-1)).to.be.false;
    expect(isPositiveInteger(-3000)).to.be.false;
    expect(isPositiveInteger(-6e4)).to.be.false;
    expect(isPositiveInteger(-9999999999)).to.be.false;
    expect(isPositiveInteger(Number.MIN_SAFE_INTEGER)).to.be.false;
  });

  it('should return false for non-integers', function () {
    expect(isPositiveInteger(.5)).to.be.false;
    expect(isPositiveInteger(3.1415)).to.be.false;
  });

  it('should return false for non-numbers', function () {
    expect(isPositiveInteger('1')).to.be.false;
    expect(isPositiveInteger('')).to.be.false;
    expect(isPositiveInteger(null)).to.be.false;
    expect(isPositiveInteger(undefined)).to.be.false;
    expect(isPositiveInteger(NaN)).to.be.false;
    expect(isPositiveInteger({})).to.be.false;
    expect(isPositiveInteger([])).to.be.false;
    expect(isPositiveInteger(function () { })).to.be.false;
  });

  it('should return false for non-safe integers', function () {
    expect(isPositiveInteger(Number.MAX_SAFE_INTEGER + 1)).to.be.false;
    expect(isPositiveInteger(Number.MIN_SAFE_INTEGER - 1)).to.be.false;
  });

});