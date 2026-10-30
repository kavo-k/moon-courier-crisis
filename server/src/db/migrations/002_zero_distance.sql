-- Several orders can share a station; a rover already there can deliver locally.
ALTER TABLE deliveries DROP CONSTRAINT deliveries_distance_check;
ALTER TABLE deliveries ADD CONSTRAINT deliveries_distance_check CHECK (distance >= 0);
