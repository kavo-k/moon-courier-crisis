import test from "node:test";
import assert from "node:assert/strict";
import { calculateExpiresDay, calculateRechargedBattery, determineFinalStatus } from "../src/domain/gameRules.js"

test('validate game rules', () => {

    assert.equal(calculateRechargedBattery(85), 100);
    assert.equal(calculateRechargedBattery(40), 70);
    assert.equal(calculateExpiresDay(2, "HIGH"), 2);
    assert.equal(calculateExpiresDay(4, "LOW"), 5);
    assert.equal(determineFinalStatus(2500, 51), "WON");
    assert.equal(determineFinalStatus(2500, 50), "LOST");
    assert.equal(determineFinalStatus(2499, 100), "LOST");
})