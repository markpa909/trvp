# trvp
cd @project_path@/server.js

npm install

npm install uuid


CREATE TABLE menu_variants (
  id int NOT NULL AUTO_INCREMENT,
  day_of_week varchar(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY day_of_week (day_of_week)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE day_menu_variants (
  id int NOT NULL AUTO_INCREMENT,
  day_of_week_id int NOT NULL,
  variant_number int NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY unique_day_variant (day_of_week_id,variant_number),
  KEY day_of_week_id (day_of_week_id,variant_number),
  CONSTRAINT day_menu_variants_ibfk_1 FOREIGN KEY (day_of_week_id) REFERENCES menu_variants (id)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE dish_types (
  id int NOT NULL AUTO_INCREMENT,
  type_name varchar(50) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY type_name (type_name)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE dish_catalog (
  id int NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  type_id int NOT NULL,
  PRIMARY KEY (id),
  KEY type_id (type_id),
  CONSTRAINT dish_catalog_ibfk_1 FOREIGN KEY (type_id) REFERENCES dish_types (id)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE dishes (
  id varchar(50) NOT NULL,
  menu_variant_id int NOT NULL,
  name varchar(100) NOT NULL,
  type_id int NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY id_UNIQUE (id),
  KEY type_id (type_id),
  KEY dishes_ibfk_1 (menu_variant_id),
  CONSTRAINT dishes_ibfk_1 FOREIGN KEY (menu_variant_id) REFERENCES day_menu_variants (id) ON DELETE CASCADE,
  CONSTRAINT dishes_ibfk_2 FOREIGN KEY (type_id) REFERENCES dish_types (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE dish_day_menu (
  dish_id varchar(50) NOT NULL,
  day_of_week_id int NOT NULL,
  variant_number int NOT NULL,
  PRIMARY KEY (dish_id,day_of_week_id,variant_number),
  KEY day_of_week_id (day_of_week_id,variant_number),
  CONSTRAINT dish_day_menu_ibfk_1 FOREIGN KEY (dish_id) REFERENCES dishes (id) ON DELETE CASCADE,
  CONSTRAINT dish_day_menu_ibfk_2 FOREIGN KEY (day_of_week_id, variant_number) REFERENCES day_menu_variants (day_of_week_id, variant_number) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;





INSERT INTO menu_variants (id, day_of_week) VALUES 
(1, 'Понедельник'),
(2, 'Вторник'),
(3, 'Среда'),
(4, 'Четверг'),
(5, 'Пятница'),
(6, 'Суббота'),
(7, 'Воскресенье');

INSERT INTO dish_types (id, type_name) VALUES 
(1, 'салат'),
(2, 'Американская пицца'),
(3, 'Итальянская пицца'),
(4, 'напиток'),
(5, 'десерт');

INSERT INTO dish_catalog (id, name, type_id) VALUES 
-- Салаты
(1, 'Салат Цезарь', 1),
(2, 'Греческий салат', 1),
(3, 'Салат Оливье', 1),
-- Американская пицца
(4, 'Пицца Пепперони', 2),
(5, 'Пицца с ветчиной и сыром', 2),
(6, 'Пицца BBQ', 2),
-- Итальянская пицца
(7, 'Пицца Маргарита', 3),
(8, 'Пицца Капричоза', 3),
(9, 'Пицца Четыре сыра', 3),
-- Напитки
(10, 'Апельсиновый сок', 4),
(11, 'Кофе', 4),
(12, 'Чай', 4),
-- Десерты
(13, 'Тирамису', 5),
(14, 'Панна-котта', 5),
(15, 'Мороженое', 5);menu_variants
