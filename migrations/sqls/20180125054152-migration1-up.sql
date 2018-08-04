SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE TABLE `jobs` (
  `task_id` int(11) UNSIGNED NOT NULL,
  `task_name` varchar(255) NOT NULL,
  `task_url_name` varchar(255) NOT NULL,
  `task_description` text NOT NULL,
  `task_price` double(10,2) NOT NULL DEFAULT '0.00',
  `task_category_id` int(11) NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `task_worker_id` int(11) UNSIGNED DEFAULT NULL,
  `task_post_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `task_assigned_date` datetime DEFAULT NULL,
  `task_complete_date` datetime DEFAULT NULL,
  `task_activity_status` int(2) NOT NULL DEFAULT '0' COMMENT '0 = draft, 1 = post, 2 = assign, 3 = complete',
  `task_start_day` varchar(50) DEFAULT NULL,
  `task_start_time` varchar(50) DEFAULT NULL,
  `task_end_day` varchar(50) DEFAULT NULL,
  `task_end_time` varchar(50) DEFAULT NULL,
  `task_online` tinyint(1) NOT NULL DEFAULT '0',
  `hourly_rate` float DEFAULT NULL,
  `hours` int(11) DEFAULT NULL,
  `no_of_fixers` int(11) DEFAULT NULL,
  `task_urgent` int(11) DEFAULT NULL,
  `fixers_shares` decimal(10,0) DEFAULT NULL,
  `is_reviewed` enum('0','1') NOT NULL DEFAULT '0',
  `location` varchar(255) NOT NULL,
  `latitude` decimal(11,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `is_approved` tinyint(4) NOT NULL DEFAULT '1' COMMENT 'Is this job approved by admin',
  `urd` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `job_categories` (
  `category_id` int(11) NOT NULL,
  `category_parent_id` int(10) DEFAULT NULL,
  `category_name` varchar(255) NOT NULL,
  `category_status` int(11) NOT NULL DEFAULT '1',
  `category_sys_name` varchar(255) NOT NULL,
  `category_description` varchar(255) DEFAULT NULL,
  `category_image` varchar(255) NOT NULL,
  `is_online` enum('0','1') NOT NULL DEFAULT '0',
  `is_editable` tinyint(2) NOT NULL DEFAULT '1',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `job_comments` (
  `comment_id` int(11) UNSIGNED NOT NULL,
  `task_id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `comment` varchar(512) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `attachment` varchar(255) DEFAULT NULL,
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `upd` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `parent_comment_id` int(11) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `job_docs` (
  `doc_id` int(10) UNSIGNED NOT NULL,
  `job_id` int(10) UNSIGNED NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `crd` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `job_feedbacks` (
  `job_id` int(10) UNSIGNED NOT NULL,
  `rating` int(11) NOT NULL,
  `feedback_tags` varchar(500) NOT NULL,
  `comment` varchar(500) NOT NULL,
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `urd` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `job_offers` (
  `offer_id` int(10) UNSIGNED NOT NULL,
  `task_id` int(10) UNSIGNED NOT NULL,
  `offered_by` int(10) UNSIGNED NOT NULL,
  `offer_comment` varchar(500) NOT NULL,
  `offer_amount` float(10,2) NOT NULL,
  `is_assigned` tinyint(2) NOT NULL DEFAULT '0',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `urd` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `reported_jobs` (
  `task_id` int(10) UNSIGNED NOT NULL,
  `reported_by` int(10) UNSIGNED NOT NULL,
  `comment` varchar(250) NOT NULL,
  `category` varchar(20) NOT NULL,
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `sys_app_languages` (
  `id` int(11) NOT NULL,
  `language` varchar(25) NOT NULL,
  `lan_code` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `sys_app_languages` (`id`, `language`, `lan_code`) VALUES
(1, 'English', 'en'),
(2, 'Spanish', 'es');

CREATE TABLE `sys_mail_templates` (
  `mail_id` varchar(100) NOT NULL,
  `html` text NOT NULL,
  `text` text NOT NULL,
  `subject` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `sys_mail_templates` (`mail_id`, `html`, `text`, `subject`) VALUES
('contactus', '<p>Message:{message}</p>', 'Message:{message}', 'Contactus Mail'),
('forgot_password', '<p>Click to reset password.{link}</p>', 'Click to reset password.{link}', 'Reset Password'),
('verification', '<p>Please verify your email.{link}</p>', 'Please verify your email.{link}', 'Verification mail');

CREATE TABLE `sys_notification_templates` (
  `id` int(11) NOT NULL,
  `template` varchar(250) NOT NULL,
  `sys_name` varchar(20) NOT NULL,
  `description` varchar(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `sys_notification_templates` (`id`, `template`, `sys_name`, `description`) VALUES
(1, 'New comment on {job_title}', 'NEW_COMMENT', 'When users comments on job'),
(2, 'New offer on {job_title}', 'NEW_OFFER', 'When user places offer on job'),
(3, 'Job {job_title} is assigned to you', 'JOB_ASSIGNED', 'whenever job is assigned'),
(4, 'Job {job_title} is completed', 'JOB_COMPLETED', 'whenever job is completed'),
(5, 'Offer has been updated on {job_title}', 'OFFER_UPDATED', 'whenever offer is updated'),
(6, 'You have been charged ${amount} for {job_title}', 'USER_CHARGED', 'whenever job is assigned or offer is updated with amount'),
(7, 'Payment of ${amount} is done for {job_title}', 'USER_PAID', 'whenever job is completed and user is paid'),
(8, 'New message from {user_name}', 'CHAT_MESSAGE', 'whenever new chat message is received');

CREATE TABLE `sys_notification_types` (
  `id` int(11) NOT NULL,
  `notification description` varchar(500) NOT NULL,
  `system_name` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `sys_notification_types` (`id`, `notification description`, `system_name`) VALUES
(1, 'Transactional', 'transactional'),
(2, 'Task Updates', 'task_updates'),
(3, 'task reminders', 'task_reminders'),
(4, 'Fixthis Alerts', 'fixthis_alerts'),
(5, 'Tasks Recommendation', 'task_recommendation'),
(6, 'Helpful Information', 'helpful_information'),
(7, 'Updates & newsletters', 'updates_newsletters');

CREATE TABLE `sys_skills` (
  `id` int(11) NOT NULL,
  `skill` varchar(20) NOT NULL,
  `sys_name` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `sys_skills` (`id`, `skill`, `sys_name`) VALUES
(1, 'Transportation', 'transportation'),
(2, 'Education', 'education'),
(3, 'Work', 'work'),
(4, 'Languages', 'languages'),
(5, 'Specialities', 'speciality');

CREATE TABLE `sys_social_sites` (
  `id` int(11) NOT NULL,
  `site_name` varchar(255) NOT NULL,
  `sys_name` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `sys_social_sites` (`id`, `site_name`, `sys_name`) VALUES
(1, 'Facebook', 'fb'),
(2, 'Google', 'google'),
(3, 'Twitter', 'tw');

CREATE TABLE `sys_user_types` (
  `id` int(11) NOT NULL,
  `role` varchar(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

INSERT INTO `sys_user_types` (`id`, `role`) VALUES
(1, 'admin'),
(2, 'appuser');

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `user_type` int(11) NOT NULL DEFAULT '2',
  `social_site` int(11) DEFAULT NULL COMMENT 'social site with which user has last logged in',
  `social_site_id` varchar(255) DEFAULT NULL,
  `verification_token` varchar(255) DEFAULT NULL COMMENT 'Email verification token .. If this is NULL is means email is verified',
  `account_status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '0==> unverfied , 1=>verified',
  `reset_token` varchar(255) DEFAULT NULL,
  `mobile_verification_token` varchar(5) DEFAULT NULL,
  `reset_token_time` bigint(20) DEFAULT NULL,
  `online_status` tinyint(2) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(4) NOT NULL DEFAULT '0',
  `last_online` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `last_logged_in` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_conversations` (
  `id` varchar(10) NOT NULL,
  `to_user` int(10) UNSIGNED NOT NULL,
  `from_user` int(10) UNSIGNED NOT NULL,
  `job_id` int(10) UNSIGNED NOT NULL,
  `message` text NOT NULL COMMENT 'base64 encoded',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_devices` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `device_token` varchar(500) NOT NULL,
  `device_type` enum('1','2') NOT NULL COMMENT '1= > ios , 2=>android',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_notifications` (
  `id` varchar(10) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `from_user_id` int(10) UNSIGNED NOT NULL,
  `template_id` int(11) NOT NULL,
  `data` varchar(500) NOT NULL,
  `metadata` varchar(500) DEFAULT NULL,
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `urd` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `read_status` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_notification_settings` (
  `user_id` int(11) UNSIGNED NOT NULL,
  `notification_type` int(11) NOT NULL,
  `email` tinyint(4) NOT NULL DEFAULT '1',
  `sms` tinyint(4) NOT NULL DEFAULT '1',
  `push` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_payment_info` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `card_token` varchar(225) DEFAULT NULL,
  `bank_token` varchar(225) DEFAULT NULL,
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `urd` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_portfolio` (
  `portfolio_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `portfolio_media` varchar(255) DEFAULT NULL,
  `media_type` tinyint(4) NOT NULL DEFAULT '0' COMMENT '0 ==> image , 1 ==> video',
  `crd` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_profile` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `is_fixer` tinyint(4) NOT NULL DEFAULT '0',
  `location` varchar(500) DEFAULT NULL,
  `profile_pic` varchar(255) DEFAULT NULL,
  `cover_pic` varchar(255) DEFAULT NULL,
  `social_profile_pic` varchar(200) DEFAULT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `about` text,
  `mobile_number` varchar(25) DEFAULT NULL,
  `is_mobile_verified` tinyint(2) NOT NULL DEFAULT '0',
  `birth_date` date DEFAULT NULL,
  `abn_number` varchar(20) DEFAULT NULL,
  `app_language` int(11) NOT NULL DEFAULT '1',
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `upd` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_skills` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `skill_id` int(11) NOT NULL,
  `value` varchar(50) NOT NULL,
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_social_info` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `site_id` int(11) NOT NULL,
  `site_token` varchar(255) NOT NULL,
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_task_alerts` (
  `alert_id` int(11) NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `alert_type` enum('1','2') NOT NULL COMMENT '1==> inperson . 2==>online',
  `keyword` varchar(100) NOT NULL,
  `suburb_lat` double DEFAULT NULL,
  `distance` int(11) DEFAULT NULL,
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `suburb_long` double DEFAULT NULL,
  `suburb` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_transactions` (
  `transaction_id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) UNSIGNED NOT NULL,
  `task_id` int(11) UNSIGNED NOT NULL,
  `pay_amount` double(10,2) NOT NULL,
  `flow` enum('1','2') NOT NULL COMMENT '''1''=>''earned'',''2''=>''outgoing''',
  `transaction_date_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `pay_transaction_id` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `user_worker_profile` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `address` varchar(500) NOT NULL,
  `state` varchar(50) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `zip` int(11) DEFAULT NULL,
  `crd` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `urd` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


ALTER TABLE `jobs`
  ADD PRIMARY KEY (`task_id`),
  ADD UNIQUE KEY `task_url_name` (`task_url_name`),
  ADD KEY `task_category_id` (`task_category_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `task_worker_id` (`task_worker_id`),
  ADD KEY `task_name` (`task_name`);

ALTER TABLE `job_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `category_sys_name` (`category_sys_name`),
  ADD UNIQUE KEY `category_parent_id_2` (`category_parent_id`,`category_name`),
  ADD KEY `category_parent_id` (`category_parent_id`);

ALTER TABLE `job_comments`
  ADD PRIMARY KEY (`comment_id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `parent_comment_id` (`parent_comment_id`);

ALTER TABLE `job_docs`
  ADD PRIMARY KEY (`doc_id`),
  ADD KEY `job_id` (`job_id`);

ALTER TABLE `job_feedbacks`
  ADD PRIMARY KEY (`job_id`);

ALTER TABLE `job_offers`
  ADD PRIMARY KEY (`offer_id`),
  ADD UNIQUE KEY `task_id_2` (`task_id`,`offered_by`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `offered_by` (`offered_by`);

ALTER TABLE `reported_jobs`
  ADD PRIMARY KEY (`task_id`,`reported_by`),
  ADD KEY `reported_by` (`reported_by`);

ALTER TABLE `sys_app_languages`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `sys_mail_templates`
  ADD PRIMARY KEY (`mail_id`);

ALTER TABLE `sys_notification_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sys_name` (`sys_name`);

ALTER TABLE `sys_notification_types`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `sys_skills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sys_name` (`sys_name`);

ALTER TABLE `sys_social_sites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `site_name` (`site_name`),
  ADD UNIQUE KEY `sys_name` (`sys_name`);

ALTER TABLE `sys_user_types`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `verification_token` (`verification_token`),
  ADD UNIQUE KEY `reset_token` (`reset_token`),
  ADD UNIQUE KEY `mobile_verification_token` (`mobile_verification_token`),
  ADD KEY `social_site` (`social_site`),
  ADD KEY `user_type` (`user_type`);

ALTER TABLE `user_conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `to_user` (`to_user`),
  ADD KEY `for_user` (`from_user`),
  ADD KEY `job_id` (`job_id`);

ALTER TABLE `user_devices`
  ADD PRIMARY KEY (`user_id`,`device_token`,`device_type`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `template_id` (`template_id`),
  ADD KEY `from_user_id` (`from_user_id`);

ALTER TABLE `user_notification_settings`
  ADD UNIQUE KEY `user_id` (`user_id`,`notification_type`),
  ADD KEY `user_notification_settings_ibfk_2` (`notification_type`);

ALTER TABLE `user_payment_info`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `card_token` (`card_token`),
  ADD UNIQUE KEY `bank_token` (`bank_token`);

ALTER TABLE `user_portfolio`
  ADD PRIMARY KEY (`portfolio_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `user_profile`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `mobile_number` (`mobile_number`),
  ADD KEY `app_language` (`app_language`);

ALTER TABLE `user_skills`
  ADD PRIMARY KEY (`user_id`,`skill_id`,`value`),
  ADD KEY `skill_id` (`skill_id`);

ALTER TABLE `user_social_info`
  ADD PRIMARY KEY (`user_id`,`site_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `site_id` (`site_id`);

ALTER TABLE `user_task_alerts`
  ADD PRIMARY KEY (`alert_id`),
  ADD KEY `user_task_alerts_ibfk_1` (`user_id`);

ALTER TABLE `user_transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `user_transactions_ibfk_1` (`user_id`),
  ADD KEY `user_transactions_ibfk_2` (`task_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `task_id` (`task_id`),
  ADD KEY `transaction_date_time` (`transaction_date_time`);

ALTER TABLE `user_worker_profile`
  ADD PRIMARY KEY (`user_id`);


ALTER TABLE `jobs`
  MODIFY `task_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `job_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `job_comments`
  MODIFY `comment_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `job_docs`
  MODIFY `doc_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `job_offers`
  MODIFY `offer_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `sys_app_languages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `sys_notification_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `sys_notification_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `sys_skills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `sys_social_sites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `sys_user_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `user_portfolio`
  MODIFY `portfolio_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

ALTER TABLE `user_task_alerts`
  MODIFY `alert_id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `user_transactions`
  MODIFY `transaction_id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT;


ALTER TABLE `jobs`
  ADD CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`task_category_id`) REFERENCES `job_categories` (`category_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `jobs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `jobs_ibfk_3` FOREIGN KEY (`task_worker_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

ALTER TABLE `job_categories`
  ADD CONSTRAINT `job_categories_ibfk_1` FOREIGN KEY (`category_parent_id`) REFERENCES `job_categories` (`category_id`) ON UPDATE CASCADE;

ALTER TABLE `job_comments`
  ADD CONSTRAINT `job_comments_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `jobs` (`task_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `job_comments_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `job_comments_ibfk_4` FOREIGN KEY (`parent_comment_id`) REFERENCES `job_comments` (`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `job_docs`
  ADD CONSTRAINT `job_docs_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`task_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `job_feedbacks`
  ADD CONSTRAINT `job_feedbacks_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`task_id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `job_offers`
  ADD CONSTRAINT `job_offers_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `jobs` (`task_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `job_offers_ibfk_2` FOREIGN KEY (`offered_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

ALTER TABLE `reported_jobs`
  ADD CONSTRAINT `reported_jobs_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `jobs` (`task_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `reported_jobs_ibfk_2` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`social_site`) REFERENCES `sys_social_sites` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`user_type`) REFERENCES `sys_user_types` (`id`) ON UPDATE CASCADE;

ALTER TABLE `user_conversations`
  ADD CONSTRAINT `user_conversations_ibfk_1` FOREIGN KEY (`to_user`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `user_conversations_ibfk_2` FOREIGN KEY (`from_user`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `user_conversations_ibfk_3` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`task_id`) ON UPDATE CASCADE;

ALTER TABLE `user_devices`
  ADD CONSTRAINT `user_devices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

ALTER TABLE `user_notifications`
  ADD CONSTRAINT `user_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `user_notifications_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `sys_notification_templates` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `user_notifications_ibfk_3` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

ALTER TABLE `user_notification_settings`
  ADD CONSTRAINT `user_notification_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_notification_settings_ibfk_2` FOREIGN KEY (`notification_type`) REFERENCES `sys_notification_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_payment_info`
  ADD CONSTRAINT `user_payment_info_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

ALTER TABLE `user_portfolio`
  ADD CONSTRAINT `user_portfolio_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

ALTER TABLE `user_profile`
  ADD CONSTRAINT `user_profile_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `user_profile_ibfk_2` FOREIGN KEY (`app_language`) REFERENCES `sys_app_languages` (`id`) ON UPDATE CASCADE;

ALTER TABLE `user_skills`
  ADD CONSTRAINT `user_skills_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `user_skills_ibfk_2` FOREIGN KEY (`skill_id`) REFERENCES `sys_skills` (`id`) ON UPDATE CASCADE;

ALTER TABLE `user_social_info`
  ADD CONSTRAINT `user_social_info_ibfk_1` FOREIGN KEY (`site_id`) REFERENCES `sys_social_sites` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `user_social_info_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

ALTER TABLE `user_task_alerts`
  ADD CONSTRAINT `user_task_alerts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_transactions`
  ADD CONSTRAINT `user_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `user_transactions_ibfk_2` FOREIGN KEY (`task_id`) REFERENCES `jobs` (`task_id`) ON UPDATE CASCADE;

ALTER TABLE `user_worker_profile`
  ADD CONSTRAINT `user_worker_profile_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

ALTER TABLE `jobs` CHANGE `task_price` `task_price` DOUBLE(10,2) NULL DEFAULT NULL;

ALTER TABLE `user_payment_info` CHANGE `card_token` `card_token` VARCHAR(700) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL, CHANGE `bank_token` `bank_token` VARCHAR(700) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL;

ALTER TABLE `job_offers` ADD `initial_offer_amount` FLOAT(10,2) NULL DEFAULT NULL COMMENT 'This is initial offer amount placed by user before any updations' AFTER `offer_amount`;

#---- 20 April ------------ 

ALTER TABLE `jobs` DROP `fixers_shares`;

ALTER TABLE `user_transactions` ADD UNIQUE(`pay_transaction_id`);

INSERT INTO `sys_mail_templates` (`mail_id`, `html`, `text`, `subject`) VALUES ('admin_user_add', '<p>Your account has been created by Fixthis admin . Details are as below </p>\r\n<div>\r\n<div>Username:{email}</div>\r\n<div>Password:{password}</div>\r\n</div>', 'Your account has been created by Fixthis admin . Details are as below \\n\r\nUsername:{email}\\n\r\nPassword:{password}', 'Fixthis account created');

INSERT INTO `sys_mail_templates` (`mail_id`, `html`, `text`, `subject`) VALUES ('admin_resetuser_pass', '<p>Your password has been reset by admin. </p>\r\n<div>New Password:{password}</div>\r\n', 'Your password has been reset by admin. .\\n\r\nNew Password:{password}', 'Fixthis password reset');

SET FOREIGN_KEY_CHECKS=1;
