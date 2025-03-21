const { v4: uuidv4 } = require('uuid');
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;

// Настройка парсинга JSON
app.use(bodyParser.json());

// Подключение к базе данных MySQL
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '1234',
    database: 'pizza_db'
});

db.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к MySQL:', err);
    } else {
        console.log('Подключение к MySQL успешно установлено!');
    }
});

// Обслуживание статических файлов из папки frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Базовый маршрут для загрузки интерфейса
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});

//Получение всех вариантов меню
app.get('/day-menu-variants', (req, res) => {
    const query = `
        SELECT dmv.id AS variant_id, mv.id AS day_of_week_id, mv.day_of_week, dmv.variant_number
        FROM day_menu_variants dmv
        JOIN menu_variants mv ON mv.id = dmv.day_of_week_id
        ORDER BY mv.id ASC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка получения вариантов меню:', err);
            res.status(500).send('Ошибка получения вариантов меню');
        } else {
            res.json(results);
        }
    });
});

// Добавление нового варианта меню
app.post('/menu-variants/:day_id', (req, res) => {
    const { day_id } = req.params; // ID дня недели
    const { variant_number } = req.body; // Номер варианта меню

    // Проверка, существует ли уже такая комбинация day_of_week_id и variant_number
    const checkQuery = `
        SELECT COUNT(*) AS count 
        FROM day_menu_variants 
        WHERE day_of_week_id = ? AND variant_number = ?;
    `;

    db.query(checkQuery, [day_id, variant_number], (err, result) => {
        if (err) {
            console.error('Ошибка при проверке варианта меню:', err);
            return res.status(500).send('Ошибка при проверке варианта меню');
        }

        if (result[0].count > 0) {
            // Если такая комбинация уже существует
            return res.status(400).send('Вариант меню с таким номером уже существует для данного дня недели');
        }

        // Если комбинация уникальна, добавляем новую запись
        const insertQuery = `
            INSERT INTO day_menu_variants (day_of_week_id, variant_number)
            VALUES (?, ?);
        `;

        db.query(insertQuery, [day_id, variant_number], (err) => {
            if (err) {
                console.error('Ошибка добавления варианта меню:', err);
                return res.status(500).send('Ошибка добавления варианта меню');
            }
            res.status(201).send('Вариант меню успешно добавлен');
        });
    });
});

//Удаление варианта меню
/*app.delete('/menu-variants/:variant_number', (req, res) => {
    const { variant_number } = req.params;

    console.log(`Deleting variant number: ${variant_number}`);

    // Удаляем только связанные блюда для конкретного variant_number
    const queryDishes = `
        DELETE FROM dishes 
        WHERE menu_variant_id = ?
    `;

    // Удаляем запись из day_menu_variants
    const queryDeleteVariant = `
        DELETE FROM day_menu_variants 
        WHERE variant_number = ?
    `;

    console.log(`Executing query to delete dishes: ${queryDishes}`);
    db.query(queryDishes, [variant_number], (err) => {
        if (err) {
            console.error(`Error deleting dishes: ${err.message}`);
            res.status(500).json({ error: 'Ошибка удаления связанных блюд', details: err.message });
        } else {
            console.log('Dishes deleted successfully.');
            console.log(`Executing query to delete menu variant: ${queryDeleteVariant}`);
            db.query(queryDeleteVariant, [variant_number], (err) => {
                if (err) {
                    console.error(`Error deleting menu variant: ${err.message}`);
                    res.status(500).json({ error: 'Ошибка удаления варианта меню', details: err.message });
                } else {
                    console.log('Menu variant deleted successfully.');
                    res.send('Вариант меню удалён.');
                }
            });
        }
    });
});*/

// Получение всех блюд для конкретного дня недели и варианта
app.get('/menu-variants/:dayOfWeekId/:variantNumber/dishes', (req, res) => {
    const { dayOfWeekId, variantNumber } = req.params;

    const query = `
        SELECT d.*
        FROM dishes d
        JOIN day_menu_variants dmv 
        ON d.menu_variant_id = dmv.id
        WHERE dmv.day_of_week_id = ? AND dmv.variant_number = ?
        ORDER BY d.type_id
    `;

    db.query(query, [dayOfWeekId, variantNumber], (err, results) => {
        if (err) {
            console.error('Ошибка получения блюд:', err);
            res.status(500).send('Ошибка получения блюд');
        } else {
            res.json(results);
        }
    });
});

// Добавление нового блюда
app.post('/menu-variants/:menuId/dishes', (req, res) => {
    const { menuId } = req.params; // menu_variant_id, связанный с вариантом меню
    let { id, name, type_id } = req.body;

    // Если id не передан, генерируем новый
    if (!id) {
        id = uuidv4();
    }

    // Получаем variant_number для указанного menuId
    const getVariantNumberQuery = `
        SELECT variant_number 
        FROM day_menu_variants
        WHERE id = ?
    `;
    db.query(getVariantNumberQuery, [menuId], (err, variantResult) => {
        if (err) {
            console.error('Ошибка получения variant_number:', err);
            res.status(500).send('Ошибка получения variant_number');
            return;
        }

        if (variantResult.length === 0) {
            res.status(400).send('Указанный вариант меню не существует');
            return;
        }

        const variantNumber = variantResult[0].variant_number;

        // Проверка на максимальное количество блюд одного типа
        const checkQuery = `
            SELECT COUNT(*) AS count
            FROM dishes
            WHERE menu_variant_id = ? AND type_id = ?
        `;
        db.query(checkQuery, [variantNumber, type_id], (err, result) => {
            if (err) {
                console.error('Ошибка проверки максимального количества блюд:', err);
                res.status(500).send('Ошибка проверки блюда');
            } else if (result[0].count >= 1) { // Ограничение на количество блюд одного типа (замените "5" при необходимости)
                res.status(400).send('Превышено максимальное количество блюд данного типа');
            } else {
                // Проверка на уникальность названия блюда
                const nameCheckQuery = `
                    SELECT COUNT(*) AS count
                    FROM dishes
                    WHERE menu_variant_id = ? AND name = ?
                `;
                db.query(nameCheckQuery, [variantNumber, name], (err, nameResult) => {
                    if (err) {
                        console.error('Ошибка проверки уникальности названия блюда:', err);
                        res.status(500).send('Ошибка проверки названия блюда');
                    } else if (nameResult[0].count > 0) {
                        res.status(400).send('Блюдо с таким названием уже существует в этом варианте меню');
                    } else {
                        // Если проверки пройдены, добавляем блюдо
                        const insertQuery = `
                            INSERT INTO dishes (id, menu_variant_id, name, type_id)
                            VALUES (?, ?, ?, ?)
                        `;
                        db.query(insertQuery, [id, variantNumber, name, type_id || 0], (err) => {
                            if (err) {
                                console.error('Ошибка добавления блюда:', err);
                                res.status(500).send('Ошибка добавления блюда');
                            } else {
                                res.status(201).send('Блюдо успешно добавлено');
                            }
                        });
                    }
                });
            }
        });
    });
});

// Добавление нового блюда
app.post('/menu-variants/:dayOfWeekId/:variantNumber/dishes', (req, res) => {
    const { dayOfWeekId, variantNumber } = req.params;
    let { id, name, type_id } = req.body;

    // Генерация id, если не передан
    if (!id) {
        id = uuidv4();
    }

    // Проверяем, существует ли указанный day_of_week_id и variant_number
    const getVariantQuery = `
        SELECT id, variant_number FROM day_menu_variants 
        WHERE day_of_week_id = ? AND variant_number = ?
    `;

    db.query(getVariantQuery, [dayOfWeekId, variantNumber], (err, results) => {
        if (err) {
            console.error('Ошибка получения варианта меню:', err);
            return res.status(500).send('Ошибка при получении варианта меню');
        }

        if (results.length === 0) {
            console.error('Вариант меню не найден для указанных day_of_week_id и variant_number');
            return res.status(404).send('Вариант меню не найден');
        }

        const menuVariantId = results[0].id; // Используем id из таблицы day_menu_variants

        // Проверка на максимальное количество блюд одного типа
        const checkQuery = `
            SELECT COUNT(*) AS count
            FROM dishes
            WHERE menu_variant_id = ? AND type_id = ?
        `;
        db.query(checkQuery, [menuVariantId, type_id], (err, result) => {
            if (err) {
                console.error('Ошибка проверки максимального количества блюд:', err);
                return res.status(500).send('Ошибка проверки блюда');
            }

            if (result[0].count >= 1) {
                return res.status(400).send('Превышено максимальное количество блюд данного типа');
            }

            // Проверка на уникальность названия блюда
            const nameCheckQuery = `
                SELECT COUNT(*) AS count
                FROM dishes
                WHERE menu_variant_id = ? AND name = ?
            `;
            db.query(nameCheckQuery, [menuVariantId, name], (err, nameResult) => {
                if (err) {
                    console.error('Ошибка проверки уникальности названия блюда:', err);
                    return res.status(500).send('Ошибка проверки названия блюда');
                }

                if (nameResult[0].count > 0) {
                    return res.status(400).send('Блюдо с таким названием уже существует в этом варианте меню');
                }

                // Добавление блюда в таблицу dishes
                const insertDishQuery = `
                    INSERT INTO dishes (id, menu_variant_id, name, type_id)
                    VALUES (?, ?, ?, ?)
                `;
                db.query(insertDishQuery, [id, menuVariantId, name, type_id || 0], (err) => {
                    if (err) {
                        console.error('Ошибка добавления блюда:', err);
                        return res.status(500).send('Ошибка добавления блюда');
                    }

                    // Добавление записи в таблицу dish_day_menu
                    const insertDishDayMenuQuery = `
                        INSERT INTO dish_day_menu (dish_id, day_of_week_id, variant_number)
                        VALUES (?, ?, ?)
                    `;
                    db.query(insertDishDayMenuQuery, [id, dayOfWeekId, variantNumber], (err) => {
                        if (err) {
                            console.error('Ошибка добавления в dish_day_menu:', err);
                            return res.status(500).send('Ошибка добавления в таблицу dish_day_menu');
                        }

                        res.status(201).send('Блюдо успешно добавлено');
                    });
                });
            });
        });
    });
});

// Удаление блюда
app.delete('/dishes/:id', (req, res) => {
    const { id } = req.params;

    // Удаление записи из таблицы dish_day_menu
    const deleteFromDishDayMenuQuery = `
        DELETE FROM dish_day_menu
        WHERE dish_id = ?
    `;

    db.query(deleteFromDishDayMenuQuery, [id], (err) => {
        if (err) {
            console.error('Ошибка удаления записи из dish_day_menu:', err);
            return res.status(500).json({ error: 'Ошибка удаления записи из dish_day_menu', details: err.message });
        }

        // Удаление записи из таблицы dishes
        const deleteFromDishesQuery = `
            DELETE FROM dishes
            WHERE id = ?
        `;

        db.query(deleteFromDishesQuery, [id], (err) => {
            if (err) {
                console.error('Ошибка удаления блюда:', err);
                return res.status(500).json({ error: 'Ошибка удаления блюда', details: err.message });
            }

            res.send('Блюдо и связанные записи успешно удалены');
        });
    });
});

// Редактирование блюда
app.put('/dishes/:id', (req, res) => {
    const { id } = req.params;
    const { name, type_id } = req.body;
    const query = 'UPDATE dishes SET name = ?, type_id = ? WHERE id = ?';
    db.query(query, [name, type_id, id], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Ошибка редактирования блюда');
        } else {
            res.send('Блюдо обновлено');
        }
    });
});

// Редактирование информации о меню в day_menu_variants
app.put('/day-menu-variants/:id', (req, res) => {
    const { id } = req.params;
    const { day_of_week_id, variant_number } = req.body;

    const query = `
        UPDATE day_menu_variants
        SET day_of_week_id = ?, variant_number = ?
        WHERE id = ?
    `;

    db.query(query, [day_of_week_id, variant_number, id], (err, result) => {
        if (err) {
            console.error(`Ошибка обновления информации о меню: ${err.message}`);
            res.status(500).json({ error: 'Ошибка обновления информации о меню', details: err.message });
        } else {
            res.send('Информация о меню обновлена.');
        }
    });
});

// Перенос блюда
app.put('/menu-variants/move-dishes', (req, res) => {
    const { dishIds, targetDayOfWeekId, targetVariantNumber, isFromCatalog } = req.body;

    if (!dishIds || !targetDayOfWeekId || !targetVariantNumber) {
        return res.status(400).json({ message: 'Необходимо указать список блюд, ID целевого дня недели и номер варианта меню' });
    }

    // Получение ID целевого варианта меню
    const getTargetVariantQuery = `
        SELECT id FROM day_menu_variants
        WHERE day_of_week_id = ? AND variant_number = ?
    `;

    const checkQuery = `
        SELECT COUNT(*) AS count
        FROM dishes
        WHERE menu_variant_id = ? AND type_id = (
            SELECT type_id FROM dishes WHERE id = ?
        )
    `;

    const updateQuery = `
        UPDATE dishes
        SET menu_variant_id = ?
        WHERE id = ?
    `;

    db.query(getTargetVariantQuery, [targetDayOfWeekId, targetVariantNumber], (err, result) => {
        if (err) {
            console.error('Ошибка получения целевого варианта меню:', err);
            return res.status(500).json({ message: 'Ошибка на сервере при получении целевого варианта меню' });
        }

        if (result.length === 0) {
            return res.status(404).json({ message: 'Целевой вариант меню не найден' });
        }

        const targetVariantId = result[0].id;

        const processDish = (dishId, callback) => {
            // Если добавляется из справочника, пропускаем проверку лимита
            if (isFromCatalog) {
                return db.query(updateQuery, [targetVariantId, dishId], (err) => {
                    if (err) {
                        console.error(`Ошибка переноса блюда с ID ${dishId}:`, err);
                        return callback(err, 'Ошибка переноса блюда');
                    }
                    callback(null, null);
                });
            }

            // Проверяем лимит блюд
            db.query(checkQuery, [targetVariantId, dishId], (err, result) => {
                if (err) {
                    console.error(`Ошибка проверки блюда с ID ${dishId}:`, err);
                    return callback(err, 'Ошибка проверки типа блюда');
                }

                if (result[0].count >= 1) {
                    return callback(null, 'Превышен лимит блюд данного типа в целевом варианте меню');
                }

                // Если проверка пройдена, выполняем перенос
                db.query(updateQuery, [targetVariantId, dishId], (err) => {
                    if (err) {
                        console.error(`Ошибка переноса блюда с ID ${dishId}:`, err);
                        return callback(err, 'Ошибка переноса блюда');
                    }
                    callback(null, null); // Успешный перенос
                });
            });
        };

        const processDishes = (index) => {
            if (index >= dishIds.length) {
                return res.json({ message: 'Блюда успешно перенесены' });
            }

            processDish(dishIds[index], (err, errorMessage) => {
                if (err) {
                    console.error('Ошибка при обработке блюда:', err);
                    return res.status(500).json({ message: 'Ошибка на сервере при обработке блюда' });
                }

                if (errorMessage) {
                    return res.status(400).json({ message: errorMessage });
                }

                processDishes(index + 1);
            });
        };

        processDishes(0);
    });
});

//Добавление нового типа блюд
app.post('/dish-types', (req, res) => {
    const { type_name } = req.body;

    if (!type_name) {
        return res.status(400).send('Название типа блюда обязательно');
    }

    const query = `
        INSERT INTO dish_types (type_name)
        VALUES (?)
    `;

    db.query(query, [type_name], (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Ошибка добавления типа блюда');
        } else {
            res.send('Тип блюда успешно добавлен');
        }
    });
});

// Получение всех типов блюд
app.get('/dish-types', (req, res) => {
    const query = 'SELECT * FROM dish_types';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка получения типов блюд:', err);
            res.status(500).send('Ошибка получения типов блюд');
        } else {
            res.json(results);
        }
    });
});

// Загрузка дней недели и привязанных вариантов меню
app.get('/week-days', (req, res) => {
    const query = `
        SELECT mv.id AS menu_variant_id, mv.day_of_week, dmv.variant_number
        FROM menu_variants mv
        LEFT JOIN day_menu_variants dmv ON mv.id = dmv.day_of_week_id;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Ошибка загрузки дней недели:", err);
            res.status(500).send("Ошибка загрузки дней недели");
        } else {
            res.json(results);
        }
    });
});


// Привязка варианта меню к дню недели
app.put('/week-days/:dayId/menu-variant', (req, res) => {
    const { dayId } = req.params; // Это ID дня недели
    const { variant_id } = req.body; // Это ID варианта меню

    const query = `
        INSERT INTO day_menu_variants (day_of_week_id, variant_number)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE variant_number = ?
    `;

    db.query(query, [dayId, variant_id, variant_id], (err) => {
        if (err) {
            console.error("Ошибка привязки варианта меню:", err);
            res.status(500).send("Ошибка привязки варианта меню");
        } else {
            res.send("Вариант меню успешно привязан");
        }
    });
});

// Удаление конкретного варианта меню для конкретного дня
app.delete('/week-days/:dayId/menu-variant/:variantNumber', (req, res) => {
    const { dayId, variantNumber } = req.params;

    if (!dayId || !variantNumber) {
        return res.status(400).send("Необходимо указать ID дня недели и номер варианта меню.");
    }

    const deleteDishesQuery = `
        DELETE FROM dishes 
        WHERE menu_variant_id = (
            SELECT id 
            FROM day_menu_variants 
            WHERE day_of_week_id = ? AND variant_number = ?
        )
    `;

    const deleteVariantQuery = `
        DELETE FROM day_menu_variants 
        WHERE day_of_week_id = ? AND variant_number = ?
    `;

    // Удаляем связанные блюда
    db.query(deleteDishesQuery, [dayId, variantNumber], (err) => {
        if (err) {
            console.error("Ошибка удаления связанных блюд:", err);
            return res.status(500).send("Ошибка удаления связанных блюд");
        }

        // Удаляем вариант меню после удаления связанных блюд
        db.query(deleteVariantQuery, [dayId, variantNumber], (err) => {
            if (err) {
                console.error("Ошибка удаления варианта меню:", err);
                return res.status(500).send("Ошибка удаления варианта меню");
            }

            res.send("Вариант меню и связанные блюда успешно удалены");
        });
    });
});

app.get('/dish-catalog', (req, res) => {
    const query = 'SELECT * FROM dish_catalog';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка получения списка блюд из справочника:', err);
            return res.status(500).send('Ошибка получения списка блюд из справочника');
        }
        res.json(results);
    });
});

app.post('/dish-catalog', (req, res) => {
    const { name, type_id } = req.body;
    if (!name || !type_id) {
        return res.status(400).send('Необходимо указать название и тип блюда');
    }

    const query = 'INSERT INTO dish_catalog (name, type_id) VALUES (?, ?)';
    db.query(query, [name, type_id], (err) => {
        if (err) {
            console.error('Ошибка добавления блюда в справочник:', err);
            return res.status(500).send('Ошибка добавления блюда в справочник');
        }
        res.send('Блюдо успешно добавлено в справочник');
    });
});

app.post('/menu-variants/:dayOfWeekId/:variantNumber/add-dish', (req, res) => {
    const { dishCatalogId } = req.body;
    const { dayOfWeekId, variantNumber } = req.params;

    if (!dishCatalogId || !dayOfWeekId || !variantNumber) {
        return res.status(400).send('Необходимо указать ID блюда из справочника, ID дня недели и номер варианта');
    }

    const getVariantQuery = `
        SELECT id FROM day_menu_variants
        WHERE day_of_week_id = ? AND variant_number = ?
    `;

    const checkTypeQuery = `
        SELECT COUNT(*) AS count
        FROM dishes
        JOIN dish_catalog ON dishes.type_id = dish_catalog.type_id
        WHERE dishes.menu_variant_id = ? AND dish_catalog.id = ?
    `;

    const insertDishQuery = `
        INSERT INTO dishes (id, menu_variant_id, name, type_id)
        SELECT ?, ?, name, type_id
        FROM dish_catalog
        WHERE id = ?
    `;

    db.query(getVariantQuery, [dayOfWeekId, variantNumber], (err, variantResult) => {
        if (err || variantResult.length === 0) {
            console.error('Ошибка получения варианта меню:', err);
            return res.status(500).send('Ошибка получения варианта меню');
        }

        const menuVariantId = variantResult[0].id;
        const generatedId = uuidv4(); // Генерация уникального id для блюда

        // Проверяем, есть ли уже блюдо с таким типом
        db.query(checkTypeQuery, [menuVariantId, dishCatalogId], (err, checkResult) => {
            if (err) {
                console.error('Ошибка проверки типа блюда:', err);
                return res.status(500).send('Ошибка проверки типа блюда');
            }

            if (checkResult[0].count > 0) {
                return res.status(400).send('Блюдо такого типа уже существует в этом варианте меню');
            }

            // Добавляем блюдо, если проверка прошла
            db.query(insertDishQuery, [generatedId, menuVariantId, dishCatalogId], (err) => {
                if (err) {
                    console.error('Ошибка добавления блюда:', err);
                    return res.status(500).send('Ошибка добавления блюда');
                }
                res.status(201).send('Блюдо успешно добавлено в меню');
            });
        });
    });
});
