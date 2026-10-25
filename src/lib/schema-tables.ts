/**
 * schema-tables.ts
 * Complete DDL schema statements with CREATE TABLE IF NOT EXISTS
 * for all 27 tables of the CMS.
 */

export const SCHEMA_TABLE_QUERIES: string[] = [
  // 1. users
  `CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`username\` varchar(50) NOT NULL,
    \`password\` varchar(255) NOT NULL,
    \`email\` varchar(100) DEFAULT NULL,
    \`role\` enum('admin','editor','staff') DEFAULT 'staff',
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    \`allowed_pages\` text DEFAULT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`username\` (\`username\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 2. settings
  `CREATE TABLE IF NOT EXISTS \`settings\` (
    \`setting_key\` varchar(50) NOT NULL,
    \`setting_value\` text DEFAULT NULL,
    PRIMARY KEY (\`setting_key\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 3. static_pages
  `CREATE TABLE IF NOT EXISTS \`static_pages\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`slug\` varchar(100) NOT NULL,
    \`title\` varchar(255) NOT NULL,
    \`content\` longtext DEFAULT NULL,
    \`meta_title\` varchar(255) DEFAULT NULL,
    \`meta_description\` text DEFAULT NULL,
    \`updated_at\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    \`blocks_data\` longtext DEFAULT NULL,
    \`featured_image\` varchar(255) DEFAULT NULL,
    \`layout\` varchar(50) DEFAULT 'container',
    \`subtitle\` varchar(255) DEFAULT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`slug\` (\`slug\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 4. navbars
  `CREATE TABLE IF NOT EXISTS \`navbars\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`parent_id\` int(11) DEFAULT NULL,
    \`label\` varchar(100) NOT NULL,
    \`url\` varchar(255) NOT NULL,
    \`icon\` varchar(50) DEFAULT NULL,
    \`order_num\` int(11) DEFAULT 0,
    \`is_active\` tinyint(1) DEFAULT 1,
    \`target_blank\` tinyint(1) DEFAULT 0,
    PRIMARY KEY (\`id\`),
    KEY \`parent_id\` (\`parent_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 5. sliders
  `CREATE TABLE IF NOT EXISTS \`sliders\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`image_path\` varchar(255) NOT NULL,
    \`title\` varchar(255) DEFAULT NULL,
    \`subtitle\` varchar(255) DEFAULT NULL,
    \`link\` varchar(255) DEFAULT NULL,
    \`order_num\` int(11) DEFAULT 0,
    \`is_active\` tinyint(1) DEFAULT 1,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    \`fit_width\` tinyint(1) DEFAULT 0,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 6. news_categories
  `CREATE TABLE IF NOT EXISTS \`news_categories\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`name\` varchar(100) NOT NULL,
    \`slug\` varchar(100) NOT NULL,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`slug\` (\`slug\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 7. news
  `CREATE TABLE IF NOT EXISTS \`news\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`category_id\` int(11) NOT NULL,
    \`title\` varchar(255) NOT NULL,
    \`content\` longtext NOT NULL,
    \`image_cover\` varchar(255) DEFAULT NULL,
    \`author_id\` int(11) DEFAULT NULL,
    \`views_count\` int(11) DEFAULT 0,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    \`updated_at\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    \`gallery_images\` text DEFAULT NULL,
    \`attachments\` text DEFAULT NULL,
    \`is_pinned\` tinyint(1) DEFAULT 0,
    PRIMARY KEY (\`id\`),
    KEY \`category_id\` (\`category_id\`),
    KEY \`author_id\` (\`author_id\`),
    KEY \`idx_news_created_at\` (\`created_at\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 8. news_tags
  `CREATE TABLE IF NOT EXISTS \`news_tags\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`news_id\` int(11) NOT NULL,
    \`tag_name\` varchar(50) NOT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`news_id\` (\`news_id\`),
    KEY \`tag_name\` (\`tag_name\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 9. personnel_positions
  `CREATE TABLE IF NOT EXISTS \`personnel_positions\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`name\` varchar(150) NOT NULL,
    \`order_num\` int(11) DEFAULT 0,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`name\` (\`name\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 10. personnel_categories
  `CREATE TABLE IF NOT EXISTS \`personnel_categories\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`name\` varchar(100) NOT NULL,
    \`order_num\` int(11) DEFAULT 0,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 11. personnel
  `CREATE TABLE IF NOT EXISTS \`personnel\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`category_id\` int(11) NOT NULL,
    \`prefix\` varchar(50) DEFAULT NULL,
    \`first_name\` varchar(100) NOT NULL,
    \`last_name\` varchar(100) NOT NULL,
    \`position_id\` int(11) DEFAULT NULL,
    \`email\` varchar(100) DEFAULT NULL,
    \`phone\` varchar(50) DEFAULT NULL,
    \`image_path\` varchar(255) DEFAULT NULL,
    \`order_num\` int(11) DEFAULT 0,
    \`is_active\` tinyint(1) DEFAULT 1,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`category_id\` (\`category_id\`),
    KEY \`position_id\` (\`position_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 12. personnel_position_links
  `CREATE TABLE IF NOT EXISTS \`personnel_position_links\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`category_id\` int(11) NOT NULL,
    \`position_id\` int(11) NOT NULL,
    \`order_num\` int(11) DEFAULT 0,
    PRIMARY KEY (\`id\`),
    KEY \`category_id\` (\`category_id\`),
    KEY \`position_id\` (\`position_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 13. personnel_special_duties
  `CREATE TABLE IF NOT EXISTS \`personnel_special_duties\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`personnel_id\` int(11) NOT NULL,
    \`category_id\` int(11) NOT NULL,
    \`is_head\` tinyint(1) DEFAULT 0,
    \`special_position\` varchar(255) DEFAULT NULL,
    PRIMARY KEY (\`id\`),
    KEY \`personnel_id\` (\`personnel_id\`),
    KEY \`category_id\` (\`category_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 14. download_categories
  `CREATE TABLE IF NOT EXISTS \`download_categories\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`name\` varchar(100) NOT NULL,
    \`order_num\` int(11) DEFAULT 0,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 15. downloads
  `CREATE TABLE IF NOT EXISTS \`downloads\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`category_id\` int(11) NOT NULL,
    \`title\` varchar(255) NOT NULL,
    \`file_path\` varchar(255) NOT NULL,
    \`file_type\` varchar(50) DEFAULT NULL,
    \`file_size\` int(11) DEFAULT 0,
    \`downloads_count\` int(11) DEFAULT 0,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`category_id\` (\`category_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 16. curriculums
  `CREATE TABLE IF NOT EXISTS \`curriculums\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`name\` varchar(255) NOT NULL,
    \`level\` varchar(50) DEFAULT 'ปวช.-ปวส.',
    \`code\` varchar(50) DEFAULT NULL,
    \`description\` text DEFAULT NULL,
    \`qualification\` text DEFAULT NULL,
    \`duration\` varchar(100) DEFAULT NULL,
    \`image_path\` varchar(255) DEFAULT NULL,
    \`file_path\` varchar(255) DEFAULT NULL,
    \`website_url\` varchar(255) DEFAULT NULL,
    \`gallery_images\` text DEFAULT NULL,
    \`career_guidelines\` text DEFAULT NULL,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 17. galleries
  `CREATE TABLE IF NOT EXISTS \`galleries\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`title\` varchar(255) NOT NULL,
    \`description\` text DEFAULT NULL,
    \`cover_image\` varchar(255) DEFAULT NULL,
    \`event_date\` date DEFAULT NULL,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    \`google_drive_url\` text DEFAULT NULL,
    \`immich_album_id\` varchar(255) DEFAULT NULL,
    \`source_type\` enum('local','gdrive','immich') DEFAULT 'local',
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 18. gallery_images
  `CREATE TABLE IF NOT EXISTS \`gallery_images\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`gallery_id\` int(11) NOT NULL,
    \`image_path\` varchar(255) NOT NULL,
    \`caption\` varchar(255) DEFAULT NULL,
    \`order_num\` int(11) DEFAULT 0,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`gallery_id\` (\`gallery_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 19. complaints
  `CREATE TABLE IF NOT EXISTS \`complaints\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`ticket_number\` varchar(20) NOT NULL,
    \`title\` varchar(255) NOT NULL,
    \`type\` enum('corruption','misconduct') NOT NULL,
    \`description\` text NOT NULL,
    \`accused_name\` varchar(255) DEFAULT NULL,
    \`incident_date\` date DEFAULT NULL,
    \`reporter_name\` varchar(255) DEFAULT NULL,
    \`reporter_email\` varchar(100) DEFAULT NULL,
    \`reporter_phone\` varchar(50) DEFAULT NULL,
    \`attachment_path\` varchar(255) DEFAULT NULL,
    \`status\` enum('pending','investigating','resolved','dismissed') DEFAULT 'pending',
    \`status_note\` text DEFAULT NULL,
    \`is_published\` tinyint(1) DEFAULT 0,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    \`updated_at\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`ticket_number\` (\`ticket_number\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 20. ita_main_topics
  `CREATE TABLE IF NOT EXISTS \`ita_main_topics\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`name\` varchar(255) NOT NULL,
    \`order_no\` int(11) DEFAULT 0,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    \`updated_at\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    \`year\` int(11) NOT NULL DEFAULT 2567,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 21. ita_sub_topics
  `CREATE TABLE IF NOT EXISTS \`ita_sub_topics\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`main_topic_id\` int(11) NOT NULL,
    \`code\` varchar(50) DEFAULT NULL,
    \`name\` varchar(255) NOT NULL,
    \`order_no\` int(11) DEFAULT 0,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    \`updated_at\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`main_topic_id\` (\`main_topic_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 22. ita_tables
  `CREATE TABLE IF NOT EXISTS \`ita_tables\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`sub_topic_id\` int(11) NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`order_no\` int(11) DEFAULT 0,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    \`updated_at\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`sub_topic_id\` (\`sub_topic_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 23. ita_items
  `CREATE TABLE IF NOT EXISTS \`ita_items\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`table_id\` int(11) NOT NULL,
    \`item_code\` varchar(50) NOT NULL,
    \`info_detail\` text NOT NULL,
    \`element_detail\` text DEFAULT NULL,
    \`order_no\` int(11) DEFAULT 0,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    \`updated_at\` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`table_id\` (\`table_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 24. ita_links
  `CREATE TABLE IF NOT EXISTS \`ita_links\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`item_id\` int(11) NOT NULL,
    \`link_type\` enum('url','file') DEFAULT 'url',
    \`url\` text NOT NULL,
    \`file_size\` int(11) DEFAULT NULL,
    \`mime_type\` varchar(100) DEFAULT NULL,
    \`link_name\` varchar(255) DEFAULT NULL,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`item_id\` (\`item_id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 25. ita_banners
  `CREATE TABLE IF NOT EXISTS \`ita_banners\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`image_path\` varchar(255) NOT NULL,
    \`year\` int(11) NOT NULL DEFAULT 2567,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 26. media
  `CREATE TABLE IF NOT EXISTS \`media\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`file_name\` varchar(255) NOT NULL,
    \`file_path\` varchar(255) NOT NULL,
    \`file_type\` varchar(50) NOT NULL,
    \`file_size\` int(11) NOT NULL,
    \`folder\` varchar(50) DEFAULT 'media',
    \`uploaded_by\` int(11) DEFAULT NULL,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`uploaded_by\` (\`uploaded_by\`),
    KEY \`idx_folder\` (\`folder\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  // 27. audit_logs
  `CREATE TABLE IF NOT EXISTS \`audit_logs\` (
    \`id\` int(11) NOT NULL AUTO_INCREMENT,
    \`user_id\` int(11) NOT NULL,
    \`action\` varchar(100) NOT NULL,
    \`target_type\` varchar(100) NOT NULL,
    \`target_id\` int(11) DEFAULT NULL,
    \`details\` text DEFAULT NULL,
    \`created_at\` timestamp NULL DEFAULT current_timestamp(),
    PRIMARY KEY (\`id\`),
    KEY \`user_id\` (\`user_id\`),
    KEY \`idx_created\` (\`created_at\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
]
