
#----- Test users ----
INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `user_type`, `social_site`, `social_site_id`, `verification_token`, `account_status`, `reset_token`, `mobile_verification_token`, `reset_token_time`, `online_status`, `is_deleted`, `last_online`, `created_at`, `updated_at`, `last_logged_in`) VALUES (NULL, NULL, NULL, 'user1@mailinator.com', '$2a$10$rd.fFFqDOtbYoij8U4X2/.B7OXbYAne/nov/IJ3rCCXlJKyWL52BC', '2', NULL, NULL, NULL, '1', NULL, NULL, NULL, '1', '0', '2018-03-22 22:42:49', '2018-01-24 01:31:33', '2018-03-23 00:22:00', '1521738619'),(NULL, NULL, NULL, 'user2@mailinator.com', '$2a$10$rd.fFFqDOtbYoij8U4X2/.B7OXbYAne/nov/IJ3rCCXlJKyWL52BC', '2', NULL, NULL, NULL, '1', NULL, NULL, NULL, '1', '0', '2018-03-22 22:42:49', '2018-01-24 01:31:33', '2018-03-23 00:22:00', '1521738619'),
(NULL, NULL, NULL, 'user3@mailinator.com', '$2a$10$rd.fFFqDOtbYoij8U4X2/.B7OXbYAne/nov/IJ3rCCXlJKyWL52BC', '2', NULL, NULL, NULL, '1', NULL, NULL, NULL, '1', '0', '2018-03-22 22:42:49', '2018-01-24 01:31:33', '2018-03-23 00:22:00', '1521738619');

#---Test Jobs

INSERT INTO `jobs` ( `task_name`, `task_url_name`, `task_description`, `task_price`, `task_category_id`, `user_id`, `task_post_date`, `task_activity_status`,  `task_online`,  `location`, `latitude`, `longitude`, `urd`) VALUES
('Job1 User1', 'SyUed2zqz', 'This is Job1 from User1', 10.00, 11,(select id from users where email='user1@mailinator.com'),  '2018-03-23 22:52:54',  1, 0,   'Mohali,india', '30.70464900', '76.71787300', '2018-03-23 17:41:06'),
('Job2 User1', 'HJc-_3G5f', 'This is Job2 from User1', 0.00, 11,(select id from users where email='user1@mailinator.com'),  '2018-03-23 22:53:13',  1,  0,   'Mohali,india', '30.70464900', '76.71787300', '2018-03-23 17:41:19'),
('Job3 User1', 'rktfdnfqM', 'This is Job3 from User1', 8.00, 12,(select id from users where email='user1@mailinator.com'),  '2018-03-23 22:53:28',  0,  0, 'Mohali,india', '30.70464900', '76.71787300', NULL),
('Job1 User2', 'SkudOhz5z', 'This is Job1 from User2', 0.00, 11,(select id from users where email='user2@mailinator.com'),  '2018-03-23 22:55:04',  0,  0,   'Goa,India', '15.29932600', '74.12399600', NULL),
('Job2 User2', 'B1btuhfcG', 'This is Job2 from User2', 9.00, 11,(select id from users where email='user2@mailinator.com'),  '2018-03-23 22:55:13',  1,  0,  'Goa,India', '15.29932600', '74.12399600', '2018-03-23 17:41:31'),
('Job3 User2', 'HkRYunfcG', 'This is Job3 from User2', 0.00, 14,(select id from users where email='user2@mailinator.com'),  '2018-03-23 22:55:26',  0,  0,  'Goa,India', '15.29932600', '74.12399600', NULL),
('Job1 User3', 'BydWFhf5G', 'This is Job1 from User3', 7.00, 10,(select id from users where email='user3@mailinator.com'),  '2018-03-23 22:57:27',  1, 0,  'Illinois,US', '40.63312500', '-89.39852800', '2018-03-23 17:41:41'),
('Job2 User3', 'rk8MY3Mcz', 'This is Job2 from User3', 0.00, 10,(select id from users where email='user3@mailinator.com'),  '2018-03-23 22:57:42',  0,  0,  'Illinois,US', '40.63312500', '-89.39852800', NULL),
('Job3 User3', 'BJlmK2G5G', 'This is Job3 from User3', 9.00, 10,(select id from users where email='user3@mailinator.com'), '2018-03-23 22:57:51', 1,  0,  'Illinois,US', '40.63312500', '-89.39852800', '2018-03-23 17:41:50');
