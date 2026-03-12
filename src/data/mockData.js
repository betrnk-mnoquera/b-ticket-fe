export const dashboardStats = [
  { icon: 'corporate_fare', label: 'Total Organizations', value: '1,284', change: '+12.5%' },
  { icon: 'store', label: 'Active Stores', value: '3,847', change: '+8.3%' },
  { icon: 'group', label: 'Total Subscribers', value: '2,847', change: '+18.6%' },
  { icon: 'payments', label: 'Revenue (MRR)', value: '$48.2K', change: '+5.7%', highlight: true },
]

export const organizations = [
  { id: 1, storeName: 'Acme Downtown', storeId: 'STR-001', organization: 'Acme Corp', category: 'Food & Beverage', status: 'verified' },
  { id: 2, storeName: 'TechHub Central', storeId: 'STR-002', organization: 'TechHub Inc', category: 'Electronics', status: 'for_review' },
  { id: 3, storeName: 'Fashion Avenue', storeId: 'STR-003', organization: 'Style Group', category: 'Retail & Fashion', status: 'verified' },
  { id: 4, storeName: 'Green Garden', storeId: 'STR-004', organization: 'Independent', category: 'Home & Garden', status: 'pending' },
  { id: 5, storeName: 'HealthFirst Clinic', storeId: 'STR-005', organization: 'HealthFirst Ltd', category: 'Health & Wellness', status: 'verified' },
  { id: 6, storeName: 'AutoMax Service', storeId: 'STR-006', organization: 'AutoMax Group', category: 'Automotive', status: 'declined' },
  { id: 7, storeName: 'Pet Paradise', storeId: 'STR-007', organization: 'Independent', category: 'Pet Services', status: 'for_review' },
  { id: 8, storeName: 'Bella Spa', storeId: 'STR-008', organization: 'Bella Wellness', category: 'Beauty & Spa', status: 'verified' },
]

export const coupons = [
  { id: 1, name: 'Summer Sale 20%', code: 'SUM20', store: 'Acme Downtown', products: 'All Products', discount: '20%', redemptions: 847, validFrom: '2025-06-01', validUntil: '2025-08-31', status: 'active', icon: 'local_offer', color: '#205C50' },
  { id: 2, name: 'Welcome Discount', code: 'WELCOME10', store: 'Fashion Avenue', products: 'Apparel', discount: '10%', redemptions: 324, validFrom: '2025-01-01', validUntil: '2025-12-31', status: 'active', icon: 'celebration', color: '#E4793A' },
  { id: 3, name: 'Flash Friday', code: 'FLASH50', store: 'TechHub Central', products: 'Electronics', discount: '50%', redemptions: 156, validFrom: '2025-07-01', validUntil: '2025-07-02', status: 'expired', icon: 'bolt', color: '#EE4036' },
  { id: 4, name: 'Buy 1 Get 1', code: 'BOGO', store: 'Acme Downtown', products: 'Burgers', discount: 'BOGO', redemptions: 0, validFrom: '2025-09-01', validUntil: '2025-09-30', status: 'scheduled', icon: 'redeem', color: '#50C9BF' },
  { id: 5, name: 'VIP Exclusive', code: 'VIP30', store: 'Bella Spa', products: 'Spa Packages', discount: '30%', redemptions: 89, validFrom: '2025-05-01', validUntil: '2025-11-30', status: 'active', icon: 'star', color: '#84BEA1' },
  { id: 6, name: 'Free Shipping', code: 'FREESHIP', store: 'Fashion Avenue', products: 'All Orders', discount: 'Free Ship', redemptions: 0, validFrom: '2025-08-15', validUntil: '2025-08-31', status: 'for_review', icon: 'local_shipping', color: '#205C50' },
  { id: 7, name: 'Holiday Bundle', code: 'HOLIDAY25', store: 'TechHub Central', products: 'Accessories', discount: '25%', redemptions: 412, validFrom: '2025-03-01', validUntil: '2025-04-30', status: 'expired', icon: 'card_giftcard', color: '#E4793A' },
  { id: 8, name: 'Pet Lovers Deal', code: 'PET15', store: 'Pet Paradise', products: 'Pet Food', discount: '15%', redemptions: 67, validFrom: '2025-06-01', validUntil: '2025-12-31', status: 'active', icon: 'pets', color: '#50C9BF' },
  { id: 9, name: 'Wellness Week', code: 'WELL20', store: 'HealthFirst Clinic', products: 'Checkups', discount: '20%', redemptions: 0, validFrom: '2025-10-01', validUntil: '2025-10-07', status: 'scheduled', icon: 'health_and_safety', color: '#205C50' },
  { id: 10, name: 'Auto Service Discount', code: 'AUTO10', store: 'AutoMax Service', products: 'Oil Change', discount: '10%', redemptions: 23, validFrom: '2025-05-01', validUntil: '2025-07-31', status: 'paused', icon: 'directions_car', color: '#6B7E79' },
]

export const adsCampaigns = [
  { id: 1, name: 'Summer Promo Blast', campaignId: 'ADS-001', merchant: 'Acme Corp', placement: 'Web', impressions: 45200, clicks: 2100, ctr: '4.6%', startDate: '2025-06-01', endDate: '2025-08-31', status: 'running' },
  { id: 2, name: 'Mobile App Launch', campaignId: 'ADS-002', merchant: 'TechHub Inc', placement: 'Mobile', impressions: 32100, clicks: 1450, ctr: '4.5%', startDate: '2025-07-01', endDate: '2025-09-30', status: 'running' },
  { id: 3, name: 'Holiday Sale Banner', campaignId: 'ADS-003', merchant: 'Style Group', placement: 'Web', impressions: 28700, clicks: 980, ctr: '3.4%', startDate: '2025-11-15', endDate: '2025-12-31', status: 'scheduled' },
  { id: 4, name: 'Wellness Awareness', campaignId: 'ADS-004', merchant: 'HealthFirst Ltd', placement: 'Mobile', impressions: 18400, clicks: 720, ctr: '3.9%', startDate: '2025-04-01', endDate: '2025-06-30', status: 'ended' },
  { id: 5, name: 'Auto Spring Deal', campaignId: 'ADS-005', merchant: 'AutoMax Group', placement: 'Web', impressions: 22800, clicks: 1100, ctr: '4.8%', startDate: '2025-03-01', endDate: '2025-05-31', status: 'paused' },
  { id: 6, name: 'Pet Adoption Drive', campaignId: 'ADS-006', merchant: 'Pet Paradise', placement: 'Mobile', impressions: 15600, clicks: 890, ctr: '5.7%', startDate: '2025-08-01', endDate: '2025-10-31', status: 'running' },
  { id: 7, name: 'Spa Retreat Promo', campaignId: 'ADS-007', merchant: 'Bella Wellness', placement: 'Web', impressions: 12300, clicks: 560, ctr: '4.6%', startDate: '2025-09-01', endDate: '2025-11-30', status: 'scheduled' },
  { id: 8, name: 'Back to School', campaignId: 'ADS-008', merchant: 'TechHub Inc', placement: 'Mobile', impressions: 31800, clicks: 1340, ctr: '4.2%', startDate: '2025-01-15', endDate: '2025-03-15', status: 'ended' },
]

export const brochures = [
  { id: 1, name: 'Summer Menu 2025', brochureId: 'BRC-001', store: 'Acme Downtown', pages: 8, views: 2470, createdAt: '2025-05-15', status: 'published' },
  { id: 2, name: 'Tech Catalog Q3', brochureId: 'BRC-002', store: 'TechHub Central', pages: 12, views: 1890, createdAt: '2025-06-01', status: 'published' },
  { id: 3, name: 'Fashion Lookbook', brochureId: 'BRC-003', store: 'Fashion Avenue', pages: 6, views: 3200, createdAt: '2025-04-20', status: 'published' },
  { id: 4, name: 'Spa Services Guide', brochureId: 'BRC-004', store: 'Bella Spa', pages: 4, views: 890, createdAt: '2025-07-10', status: 'draft' },
  { id: 5, name: 'Pet Care Manual', brochureId: 'BRC-005', store: 'Pet Paradise', pages: 10, views: 1240, createdAt: '2025-03-25', status: 'published' },
  { id: 6, name: 'Auto Maintenance Tips', brochureId: 'BRC-006', store: 'AutoMax Service', pages: 5, views: 0, createdAt: '2025-08-01', status: 'for_review' },
  { id: 7, name: 'Wellness Programs', brochureId: 'BRC-007', store: 'HealthFirst Clinic', pages: 7, views: 1560, createdAt: '2025-02-14', status: 'archived' },
  { id: 8, name: 'Garden Supplies Catalog', brochureId: 'BRC-008', store: 'Green Garden', pages: 9, views: 670, createdAt: '2025-06-20', status: 'draft' },
]

export const subscribers = [
  { id: 1, name: 'Maria Santos', email: 'maria@email.com', avatar: 'MS', plan: 'yearly', status: 'active', engagement: 92, couponsUsed: 34, subscribedDate: '2024-03-15' },
  { id: 2, name: 'James Cruz', email: 'james@email.com', avatar: 'JC', plan: 'monthly', status: 'active', engagement: 78, couponsUsed: 18, subscribedDate: '2024-06-22' },
  { id: 3, name: 'Anna Reyes', email: 'anna@email.com', avatar: 'AR', plan: 'monthly', status: 'expiring', engagement: 45, couponsUsed: 12, subscribedDate: '2024-08-10' },
  { id: 4, name: 'Carlos Garcia', email: 'carlos@email.com', avatar: 'CG', plan: 'yearly', status: 'active', engagement: 88, couponsUsed: 29, subscribedDate: '2024-01-05' },
  { id: 5, name: 'Diana Lee', email: 'diana@email.com', avatar: 'DL', plan: 'trial', status: 'trial', engagement: 25, couponsUsed: 3, subscribedDate: '2025-07-01' },
  { id: 6, name: 'Rafael Torres', email: 'rafael@email.com', avatar: 'RT', plan: 'monthly', status: 'churned', engagement: 12, couponsUsed: 8, subscribedDate: '2024-09-18' },
  { id: 7, name: 'Sofia Mendoza', email: 'sofia@email.com', avatar: 'SM', plan: 'yearly', status: 'active', engagement: 95, couponsUsed: 41, subscribedDate: '2023-11-20' },
  { id: 8, name: 'Miguel Ramos', email: 'miguel@email.com', avatar: 'MR', plan: 'monthly', status: 'active', engagement: 67, couponsUsed: 15, subscribedDate: '2024-12-03' },
  { id: 9, name: 'Lisa Tan', email: 'lisa@email.com', avatar: 'LT', plan: 'monthly', status: 'cancelled', engagement: 0, couponsUsed: 5, subscribedDate: '2024-07-14' },
  { id: 10, name: 'David Fernandez', email: 'david@email.com', avatar: 'DF', plan: 'trial', status: 'trial', engagement: 35, couponsUsed: 2, subscribedDate: '2025-07-10' },
]

export const lineOfBusiness = [
  { id: 1, name: 'Food & Beverage', categoryId: 'CAT-001', icon: 'restaurant', color: '#205C50', stores: 86, status: 'active', fields: [
    { name: 'Cuisine Type', type: 'select', options: ['Filipino', 'Japanese', 'Italian', 'Chinese', 'American', 'Korean'] },
    { name: 'Seating Capacity', type: 'number' },
    { name: 'Dining Area', type: 'select', options: ['Indoor', 'Outdoor', 'Both'] },
    { name: 'WiFi Available', type: 'boolean' },
    { name: 'Parking', type: 'boolean' },
  ]},
  { id: 2, name: 'Retail & Fashion', categoryId: 'CAT-002', icon: 'shopping_bag', color: '#E4793A', stores: 64, status: 'active', fields: [
    { name: 'Store Size', type: 'select', options: ['Small', 'Medium', 'Large'] },
    { name: 'Product Range', type: 'text' },
    { name: 'Fitting Room', type: 'boolean' },
    { name: 'Return Policy Days', type: 'number' },
  ]},
  { id: 3, name: 'Electronics', categoryId: 'CAT-003', icon: 'devices', color: '#50C9BF', stores: 42, status: 'active', fields: [
    { name: 'Brand Authorized', type: 'boolean' },
    { name: 'Repair Service', type: 'boolean' },
    { name: 'Warranty Type', type: 'select', options: ['Standard', 'Extended', 'None'] },
    { name: 'Product Categories', type: 'text' },
  ]},
  { id: 4, name: 'Health & Wellness', categoryId: 'CAT-004', icon: 'health_and_safety', color: '#84BEA1', stores: 38, status: 'active', fields: [
    { name: 'Specialization', type: 'select', options: ['General', 'Dental', 'Dermatology', 'Optometry', 'Therapy'] },
    { name: 'Licensed Practitioners', type: 'number' },
    { name: 'Accepts Insurance', type: 'boolean' },
    { name: 'Walk-In Accepted', type: 'boolean' },
  ]},
  { id: 5, name: 'Home & Garden', categoryId: 'CAT-005', icon: 'yard', color: '#205C50', stores: 28, status: 'active', fields: [
    { name: 'Product Type', type: 'select', options: ['Furniture', 'Decor', 'Plants', 'Tools', 'Outdoor'] },
    { name: 'Delivery Available', type: 'boolean' },
    { name: 'Assembly Service', type: 'boolean' },
  ]},
  { id: 6, name: 'Automotive', categoryId: 'CAT-006', icon: 'directions_car', color: '#6B7E79', stores: 35, status: 'active', fields: [
    { name: 'Service Type', type: 'select', options: ['Repair', 'Parts', 'Detailing', 'Tire Service', 'Full Service'] },
    { name: 'Bay Capacity', type: 'number' },
    { name: 'Towing Service', type: 'boolean' },
  ]},
  { id: 7, name: 'Entertainment', categoryId: 'CAT-007', icon: 'sports_esports', color: '#E4793A', stores: 22, status: 'active', fields: [
    { name: 'Entertainment Type', type: 'select', options: ['Gaming', 'Cinema', 'KTV', 'Bowling', 'Arcade'] },
    { name: 'Max Capacity', type: 'number' },
    { name: 'Age Restriction', type: 'boolean' },
  ]},
  { id: 8, name: 'Beauty & Spa', categoryId: 'CAT-008', icon: 'spa', color: '#84BEA1', stores: 31, status: 'active', fields: [
    { name: 'Services Offered', type: 'select', options: ['Hair', 'Nails', 'Massage', 'Facial', 'Full Service'] },
    { name: 'Treatment Rooms', type: 'number' },
    { name: 'Appointment Required', type: 'boolean' },
  ]},
]

export const roles = [
  { id: 1, name: 'Super Admin', roleId: 'ROLE-001', icon: 'shield', color: '#205C50', description: 'Full system access with all permissions', users: 1, permissions: ['Dashboard', 'Organizations', 'Coupons', 'Ads Management', 'Brochures', 'Subscribers', 'Categories', 'Users', 'Roles'], status: 'active' },
  { id: 2, name: 'Admin', roleId: 'ROLE-002', icon: 'admin_panel_settings', color: '#50C9BF', description: 'Administrative access for daily operations', users: 3, permissions: ['Dashboard', 'Organizations', 'Coupons', 'Ads Management', 'Brochures', 'Subscribers', 'Categories'], status: 'active' },
  { id: 3, name: 'Editor', roleId: 'ROLE-003', icon: 'edit', color: '#E4793A', description: 'Can create and edit content', users: 2, permissions: ['Dashboard', 'Organizations', 'Coupons', 'Brochures'], status: 'active' },
  { id: 4, name: 'Viewer', roleId: 'ROLE-004', icon: 'visibility', color: '#6B7E79', description: 'Read-only access to view data', users: 2, permissions: ['Dashboard'], status: 'active' },
]

export const users = [
  { id: 1, name: 'John Doe', email: 'john@bticket.com', initials: 'JD', role: 'super_admin', status: 'active', lastLogin: '2025-07-15 09:30', createdAt: '2024-01-10' },
  { id: 2, name: 'Jane Smith', email: 'jane@bticket.com', initials: 'JS', role: 'admin', status: 'active', lastLogin: '2025-07-15 08:45', createdAt: '2024-02-15' },
  { id: 3, name: 'Mark Rivera', email: 'mark@bticket.com', initials: 'MR', role: 'admin', status: 'active', lastLogin: '2025-07-14 16:20', createdAt: '2024-03-20' },
  { id: 4, name: 'Sarah Chen', email: 'sarah@bticket.com', initials: 'SC', role: 'admin', status: 'active', lastLogin: '2025-07-15 10:00', createdAt: '2024-04-05' },
  { id: 5, name: 'Alex Torres', email: 'alex@bticket.com', initials: 'AT', role: 'editor', status: 'active', lastLogin: '2025-07-13 14:30', createdAt: '2024-05-12' },
  { id: 6, name: 'Kim Santos', email: 'kim@bticket.com', initials: 'KS', role: 'editor', status: 'active', lastLogin: '2025-07-12 11:15', createdAt: '2024-06-18' },
  { id: 7, name: 'Leo Garcia', email: 'leo@bticket.com', initials: 'LG', role: 'viewer', status: 'active', lastLogin: '2025-07-10 09:00', createdAt: '2024-07-22' },
  { id: 8, name: 'Nina Reyes', email: 'nina@bticket.com', initials: 'NR', role: 'viewer', status: 'inactive', lastLogin: '2025-06-28 15:45', createdAt: '2024-08-30' },
]

export const revenueChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  values: [32000, 35000, 38000, 36000, 42000, 45000, 43000, 48000, 46000, 50000, 52000, 48200],
}

export const subscriberChartData = {
  labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  newSubscribers: [180, 220, 195, 260, 310, 285],
  churned: [25, 30, 18, 22, 35, 28],
}

export const storePerformanceData = {
  labels: ['Acme Downtown', 'Fashion Avenue', 'TechHub Central', 'Bella Spa', 'Pet Paradise', 'Green Garden'],
  values: [48200, 42100, 38700, 31500, 28900, 24600],
}

export const adsPerformanceData = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
  impressions: [42000, 45000, 48000, 44000, 47000],
  clicks: [1800, 2100, 2400, 1950, 2200],
  conversions: [320, 380, 420, 350, 400],
}

export const allPermissions = [
  { key: 'Dashboard', icon: 'dashboard', description: 'View dashboard analytics and reports' },
  { key: 'Organizations', icon: 'corporate_fare', description: 'Manage organizations and stores' },
  { key: 'Coupons', icon: 'confirmation_number', description: 'Create and manage coupons' },
  { key: 'Ads Management', icon: 'campaign', description: 'Manage advertising campaigns' },
  { key: 'Brochures', icon: 'menu_book', description: 'Create and publish brochures' },
  { key: 'Subscribers', icon: 'group', description: 'View and manage subscribers' },
  { key: 'Categories', icon: 'category', description: 'Manage business categories' },
  { key: 'Users', icon: 'person', description: 'Manage system users' },
  { key: 'Roles', icon: 'admin_panel_settings', description: 'Configure roles and permissions' },
]

export const placementOptions = [
  { value: 'leaderboard', label: 'Leaderboard', dimensions: '728×90', rate: 12, type: 'Web' },
  { value: 'hero_banner', label: 'Hero Banner', dimensions: '1440×400', rate: 30, type: 'Web' },
  { value: 'sidebar', label: 'Sidebar Ad', dimensions: '300×250', rate: 10, type: 'Web' },
  { value: 'footer', label: 'Footer Banner', dimensions: '1200×120', rate: 8, type: 'Web' },
  { value: 'mobile_banner', label: 'Mobile Banner', dimensions: '320×50', rate: 6, type: 'Mobile' },
  { value: 'mobile_card', label: 'Mobile Card', dimensions: '600×400', rate: 18, type: 'Mobile' },
  { value: 'interstitial', label: 'Interstitial', dimensions: '320×480', rate: 22, type: 'Mobile' },
  { value: 'full_width', label: 'Full-Width Banner', dimensions: '414×200', rate: 14, type: 'Mobile' },
]
