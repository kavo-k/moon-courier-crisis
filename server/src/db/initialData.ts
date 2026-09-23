import type { PoolClient } from "pg";

export async function insertInitialRoversAndOrders(
    client: PoolClient,
): Promise<void> {
    await client.query(`INSERT INTO rovers (
    name,
    battery,
    capacity,
    status,
    x,
    y
)
VALUES
    ('Pathfinder', 85, 20, 'AVAILABLE', 45, 50),
    ('Atlas', 100, 40, 'AVAILABLE', 45, 50),
    ('Scout', 65, 12, 'AVAILABLE', 45, 50)`);


    await client.query(`INSERT INTO orders (
    destination,
    x,
    y,
    weight,
    reward,
    urgency,
    base_risk,
    terrain,
    status,
    expires_day
)
VALUES
    ('Alpha Station', 65, 25, 12, 240, 'HIGH', 10, 'ROCKY', 'AVAILABLE', 1),
    ('Research Camp', 20, 70, 8, 180, 'MEDIUM', 5, 'SAFE', 'AVAILABLE', 2),
    ('Crater-7', 75, 75, 28, 420, 'HIGH', 20, 'CRATER', 'AVAILABLE', 1),
    ('Mining Site', 68, 48, 42, 600, 'LOW', 12, 'ROCKY', 'AVAILABLE', 3),
    ('Helios Outpost', 88, 32, 18, 360, 'MEDIUM', 18, 'CRATER', 'AVAILABLE', 2)`);
}