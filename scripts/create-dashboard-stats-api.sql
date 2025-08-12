-- Create a function to get dashboard statistics
CREATE OR REPLACE FUNCTION get_dashboard_stats(company_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_buildings INTEGER;
    total_units INTEGER;
    vacant_units INTEGER;
    total_tenants INTEGER;
    monthly_revenue DECIMAL;
    occupancy_rate DECIMAL;
    pending_inquiries INTEGER;
BEGIN
    -- Get total buildings
    SELECT COUNT(*) INTO total_buildings
    FROM buildings 
    WHERE company_account_id = company_id AND status = 'active';
    
    -- Get total units (from vacant_units table for now)
    SELECT COUNT(*) INTO total_units
    FROM vacant_units 
    WHERE company_account_id = company_id;
    
    -- Get vacant units
    SELECT COUNT(*) INTO vacant_units
    FROM vacant_units 
    WHERE company_account_id = company_id AND status = 'available';
    
    -- Get total tenants
    SELECT COUNT(*) INTO total_tenants
    FROM tenants 
    WHERE company_account_id = company_id AND status = 'active';
    
    -- Calculate monthly revenue (sum of rent amounts for occupied units)
    SELECT COALESCE(SUM(rent_amount), 0) INTO monthly_revenue
    FROM vacant_units 
    WHERE company_account_id = company_id AND status = 'occupied';
    
    -- Calculate occupancy rate
    IF total_units > 0 THEN
        occupancy_rate := ROUND(((total_units - vacant_units)::DECIMAL / total_units::DECIMAL) * 100, 1);
    ELSE
        occupancy_rate := 0;
    END IF;
    
    -- Get pending inquiries
    SELECT COUNT(*) INTO pending_inquiries
    FROM inquiries 
    WHERE company_account_id = company_id AND status IN ('open', 'pending');
    
    -- Build result JSON
    result := json_build_object(
        'totalBuildings', total_buildings,
        'totalUnits', total_units,
        'vacantUnits', vacant_units,
        'totalTenants', total_tenants,
        'monthlyRevenue', monthly_revenue,
        'occupancyRate', occupancy_rate,
        'pendingInquiries', pending_inquiries,
        'recentActivity', '[]'::json
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;
