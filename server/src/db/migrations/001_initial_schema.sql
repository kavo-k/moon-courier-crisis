CREATE TABLE
    game_state (
        id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        day SMALLINT NOT NULL CHECK (day BETWEEN 1 AND 5),
        money INTEGER NOT NULL CHECK (money >= 0),
        score INTEGER NOT NULL CHECK (score >= 0),
        rating SMALLINT NOT NULL CHECK (rating BETWEEN 0 AND 100),
        deliveries_today SMALLINT NOT NULL CHECK (deliveries_today BETWEEN 0 AND 3),
        status VARCHAR(10) NOT NULL CHECK (status IN ('ACTIVE', 'WON', 'LOST'))
    );

CREATE TABLE
    rovers (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        battery SMALLINT NOT NULL CHECK (battery BETWEEN 0 AND 100),
        capacity SMALLINT NOT NULL CHECK (capacity > 0),
        status VARCHAR(15) NOT NULL CHECK (
            status IN ('AVAILABLE', 'DELIVERING', 'CHARGING', 'BROKEN')
        ),
        x SMALLINT NOT NULL CHECK (x BETWEEN 0 AND 100),
        y SMALLINT NOT NULL CHECK (y BETWEEN 0 AND 100)
    );

CREATE TABLE
    orders (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        destination TEXT NOT NULL,
        x SMALLINT NOT NULL CHECK (x BETWEEN 0 AND 100),
        y SMALLINT NOT NULL CHECK (y BETWEEN 0 AND 100),
        weight SMALLINT NOT NULL CHECK (weight > 0),
        reward INTEGER NOT NULL CHECK (reward > 0),
        urgency VARCHAR(10) NOT NULL CHECK (urgency IN ('LOW', 'MEDIUM', 'HIGH')),
        base_risk SMALLINT NOT NULL CHECK (base_risk BETWEEN 0 AND 100),
        terrain VARCHAR(10) NOT NULL CHECK (terrain IN ('SAFE', 'ROCKY', 'CRATER')),
        status VARCHAR(15) NOT NULL CHECK (
            status IN (
                'AVAILABLE',
                'IN_DELIVERY',
                'DELIVERED',
                'FAILED',
                'EXPIRED'
            )
        ),
        expires_day SMALLINT NOT NULL CHECK (expires_day BETWEEN 1 AND 5)
    );

CREATE TABLE
    deliveries (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        order_id INTEGER NOT NULL UNIQUE REFERENCES orders (id),
        rover_id INTEGER NOT NULL REFERENCES rovers (id),
        distance REAL NOT NULL CHECK (distance > 0),
        battery_cost SMALLINT NOT NULL CHECK (battery_cost BETWEEN 0 AND 100),
        final_risk SMALLINT NOT NULL CHECK (final_risk BETWEEN 0 AND 100),
        status VARCHAR(15) NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
        outcome VARCHAR(20) CHECK (
            outcome IN (
                'SUCCESS',
                'SOLAR_STORM',
                'MINOR_DAMAGE',
                'DELIVERY_FAILED'
            )
        ),
        reward_received INTEGER NOT NULL CHECK (reward_received >= 0) DEFAULT 0,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        completed_at TIMESTAMPTZ
    );

CREATE TABLE
    events (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        delivery_id INTEGER REFERENCES deliveries (id),
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL default NOW ()
    );