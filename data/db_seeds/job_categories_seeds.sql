
INSERT INTO `job_categories` (`category_id`, `category_parent_id`, `category_name`, `category_status`, `category_sys_name`, `category_description`, `category_image`, `crd`) VALUES
(1, NULL, 'House Chores', 1, 'house-chores', 'House Chores', '53707category_House.jpg', '2018-02-04 11:25:19'),
(2, NULL, 'Delivery', 1, 'delivery', 'Delivery/Courier', '71165category_package_courrier_service.jpg', '2018-02-04 11:25:19'),
(3, NULL, 'Office Help', 1, 'office-help', 'Office Help', '34567category_office.jpg', '2018-02-04 11:25:19'),
(4, 2, 'Courier', 1, 'courier', 'Courier', '75520category_courier.png', '2018-02-04 11:25:19'),
(5, 1, 'Laundry', 1, 'laundry', 'Laundry', '79077category_laundry.jpg', '2018-02-04 11:25:19'),
(6, NULL, 'Home Repair', 1, 'handyman', 'Handyman', '13630category_Handy.png', '2018-02-04 11:25:19'),
(7, NULL, 'Removalist', 1, 'moving-help', 'Moving Help', '60889category_moving.png', '2018-02-04 11:25:19'),
(8, NULL, 'Event Help', 1, 'event-help', 'Event Help', '59641category_event.jpg', '2018-02-04 11:25:19'),
(9, NULL, 'Skilled', 0, 'skilled', 'Skilled', '63107category_.jpg', '2018-02-04 11:25:19'),
(10, 9, 'Electrical Work', 1, 'electrical-work', 'Electrical Work', '67635category_electrical.jpg', '2018-02-04 11:25:19'),
(11, 1, 'Junk Removal', 1, 'junk-removal', NULL, '68619category_junk-removal-services.png', '2018-02-04 11:25:19'),
(12, 3, 'Accounting', 1, 'accounting', NULL, '94596category_accountanting.jpg', '2018-02-04 11:25:19'),
(13, 3, 'Data Entry', 1, 'data-entry', NULL, '97414category_data-entry.png', '2018-02-04 11:25:19'),
(14, 8, 'Videography', 0, 'videography2', NULL, '52013category_Videography.jpg', '2018-02-04 11:25:19'),
(15, 1, 'Cleaning', 1, 'cleaning', NULL, '80079category_cleaning1.jpg', '2018-02-04 11:25:19'),
(16, 9, 'Construction', 1, 'construction', NULL, '80202category_constructions.jpg', '2018-02-04 11:25:19'),
(17, 9, 'Plumbing', 1, 'plumbing', NULL, '91263category_Plumbing.png', '2018-02-04 11:25:19'),
(18, 9, 'Automotive', 1, 'automotive', NULL, '55470category_automotive.jpg', '2018-02-04 11:25:19'),
(19, 9, 'Painting', 1, 'painting', NULL, '9919category_painting.jpg', '2018-02-04 11:25:19'),
(20, NULL, 'Shopping', 1, 'shopping', NULL, '40364category_Shopping.jpg', '2018-02-04 11:25:19'),
(21, NULL, 'Child Care', 1, 'child-care', NULL, '52698category_Childcare.jpg', '2018-02-04 11:25:19'),
(22, NULL, 'Computer IT', 1, 'computer-help', NULL, '5714category_comp.png', '2018-02-04 11:25:19'),
(23, NULL, 'Website Design', 1, 'website-design', NULL, '75749category_web-design.jpg', '2018-02-04 11:25:19'),
(24, NULL, 'Creative', 0, 'creative', NULL, '47066category_.jpg', '2018-02-04 11:25:19'),
(25, 24, 'Writing', 1, 'writing', NULL, '92938category_Writing_Img.jpg', '2018-02-04 11:25:19'),
(26, 24, 'Photography', 1, 'photography3', NULL, '97608category_Photography.jpg', '2018-02-04 11:25:19'),
(27, 24, 'Videography', 1, 'videography1', NULL, '80900category_Videography.jpg', '2018-02-04 11:25:19'),
(28, NULL, 'Health & Medical', 1, 'health-medical', NULL, '48196category_Health.jpg', '2018-02-04 11:25:19'),
(29, NULL, 'Personal Care', 1, 'personal-care', NULL, '14594category_Care.jpg', '2018-02-04 11:25:19'),
(30, NULL, 'Pets', 1, 'pet-care', NULL, '61270category_pet-care.jpg', '2018-02-04 11:25:19'),
(31, 30, 'Dog Walking', 1, 'dog-walking', NULL, '34288category_dog-walking.jpg', '2018-02-04 11:25:19'),
(32, NULL, 'Selling', 1, 'selling', NULL, '98145category_selling.jpg', '2018-02-04 11:25:19'),
(33, NULL, 'Logistics/Transport', 1, 'logistics-transport', 'Transport', '43392category_log-shipping.jpg', '2018-02-04 11:25:19'),
(34, NULL, 'Yard Work', 1, 'garden-work', NULL, '70647category_garden.png', '2018-02-04 11:25:19'),
(35, NULL, 'Flyer Delivery', 1, 'flyer-delivery', 'Flyer Delivery ', '54195category_flyers.jpg', '2018-02-04 11:25:19'),
(36, NULL, 'Furniture Assembly', 1, 'furniture-assembly1', 'Furniture Assembly', '87719category_Furniture.png', '2018-02-04 11:25:19'),
(37, NULL, 'Misc. Odd Jobs', 1, 'misc-odd-jobs', 'Miscelleous jobs that doesnt fit in other category', '53707category_House.jpg', '2018-02-04 11:25:19');

#update is editable for 9 categories

UPDATE job_categories SET is_editable = 0 WHERE category_sys_name IN ('moving-help','delivery','handyman','computer-help','automotive','cleaning','pet-care','garden-work','furniture-assembly1')