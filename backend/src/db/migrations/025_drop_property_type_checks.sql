-- Property/place types now come from ONE shared app list (lib/listingMeta) that
-- can grow freely, so drop the rigid DB CHECK constraints that would reject any
-- new type. Also fixes an existing bug where the owner form offered "villa" but
-- the properties CHECK rejected it. Validation stays in the app layer.

ALTER TABLE properties     DROP CONSTRAINT IF EXISTS properties_property_type_check;
ALTER TABLE roommate_posts DROP CONSTRAINT IF EXISTS roommate_posts_place_type_check;
