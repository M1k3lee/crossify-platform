-- Test query to verify STRING_AGG casting works
-- This simulates what the adapter should generate

-- Test 1: Boolean column (is_graduated)
SELECT STRING_AGG(CAST(td.is_graduated AS TEXT), ',') 
FROM token_deployments td;

-- Test 2: Numeric column (market_cap)
SELECT STRING_AGG(CAST(td.market_cap AS TEXT), ',') 
FROM token_deployments td;

-- Test 3: String column (chain) - should work without cast, but cast is safe
SELECT STRING_AGG(CAST(td.chain AS TEXT), ',') 
FROM token_deployments td;

-- Test 4: DISTINCT with cast
SELECT STRING_AGG(DISTINCT CAST(td.is_graduated AS TEXT), ',') 
FROM token_deployments td;

-- Full marketplace query (what should be generated)
SELECT 
  t.id, t.name, t.symbol,
  STRING_AGG(DISTINCT CAST(td.chain AS TEXT), ',') as chains,
  STRING_AGG(DISTINCT CAST(td.token_address AS TEXT), ',') as token_addresses,
  STRING_AGG(DISTINCT CAST(td.curve_address AS TEXT), ',') as curve_addresses,
  STRING_AGG(DISTINCT CAST(td.status AS TEXT), ',') as deployment_statuses,
  STRING_AGG(DISTINCT CAST(td.is_graduated AS TEXT), ',') as graduation_statuses,
  STRING_AGG(DISTINCT CAST(td.market_cap AS TEXT), ',') as market_caps
FROM tokens t
LEFT JOIN token_deployments td ON t.id = td.token_id
WHERE (t.deleted IS NULL OR t.deleted = 0)
  AND (t.visible_in_marketplace IS NULL OR t.visible_in_marketplace = 1)
GROUP BY t.id, t.name, t.symbol;

