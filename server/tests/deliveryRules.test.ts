import test from "node:test";
import assert from "node:assert/strict";

import { calculateBatteryCost, calculateDistance, calculateRisk, validateDelivery } from "../src/domain/deliveryRules.js";

test("calculates distance using the Pythagorean theorem", () => {
    const distance = calculateDistance(
        { x: 0, y: 0 },
        { x: 3, y: 4 },
    );

    assert.equal(distance, 5);
});

test('calculate battery cost', () => {
    const batteryCostSafe = calculateBatteryCost(
        80, 21, 30, "SAFE"
    )

    const batteryCostRocky = calculateBatteryCost(
        50, 20, 40, "ROCKY"
    )

    const batteryCostCrater = calculateBatteryCost(
        50, 20, 30, "CRATER"
    )

    const safe = calculateBatteryCost(30, 10, 20, "SAFE");
    const rocky = calculateBatteryCost(30, 10, 20, "ROCKY");
    const crater = calculateBatteryCost(30, 10, 20, "CRATER");

    const lightCost = calculateBatteryCost(30, 5, 20, "SAFE");
    const heavyCost = calculateBatteryCost(30, 18, 20, "SAFE");

    assert.ok(rocky > safe);
    assert.ok(crater > rocky);

    assert.ok(heavyCost > lightCost);

    assert.equal(batteryCostSafe, 60);
    assert.equal(batteryCostRocky, 42);
    assert.equal(batteryCostCrater, 50);
})

test('calculate risk', () => {
    const risk1 = calculateRisk(15, 'SAFE')
    const risk2 = calculateRisk(15, 'ROCKY')
    const risk3 = calculateRisk(15, 'CRATER')
    const risk4 = calculateRisk(90, 'CRATER')

    assert.equal(risk1, 15);
    assert.equal(risk2, 25);
    assert.equal(risk3, 35);
    assert.equal(risk4, 95);
})

test('validate delivery', () => {
    const validate1 = validateDelivery({
        orderStatus: 'AVAILABLE',
        roverStatus: 'AVAILABLE',
        orderWeight: 42,
        roverCapacity: 40,
        roverBattery: 80,
        batteryCost: 40
    })

    const validate2 = validateDelivery({
        orderStatus: 'AVAILABLE',
        roverStatus: 'AVAILABLE',
        orderWeight: 19,
        roverCapacity: 20,
        roverBattery: 31,
        batteryCost: 48
    })

    const validate3 = validateDelivery({
        orderStatus: 'AVAILABLE',
        roverStatus: 'AVAILABLE',
        orderWeight: 19,
        roverCapacity: 20,
        roverBattery: 100,
        batteryCost: 48
    })

    const validate4 = validateDelivery({
        orderStatus: 'AVAILABLE',
        roverStatus: 'BROKEN',
        orderWeight: 19,
        roverCapacity: 20,
        roverBattery: 100,
        batteryCost: 48
    })

    const validate5 = validateDelivery({
        orderStatus: 'DELIVERED',
        roverStatus: 'AVAILABLE',
        orderWeight: 19,
        roverCapacity: 20,
        roverBattery: 100,
        batteryCost: 48
    })

    assert.deepEqual(validate1, { possible: false, problems: [{ code: 'CAPACITY_EXCEEDED', message: `Груз превышает допустимую вместимость на 2 кг.` }] });
    assert.deepEqual(validate2, { possible: false, problems: [{ code: 'INSUFFICIENT_BATTERY', message: `Недостаточный заряд батареи, Требуется: 48%. Доступно: 31%.` }] });
    assert.deepEqual(validate3, { possible: true, problems: [] })
    assert.ok(
        validate4.problems.some(
            (problem) => problem.code === "ROVER_NOT_AVAILABLE",
        ),
    );
    assert.ok(
        validate5.problems.some(
            (problem) => problem.code === "ORDER_NOT_AVAILABLE",
        ),
    );


})