document.addEventListener("DOMContentLoaded", () => {
    const apiUrl = "http://localhost:3000";

    // Элементы интерфейса
    const menuVariantsContainer = document.querySelector("#menu-variants-container");
    const addVariantBtn = document.querySelector("#add-variant-btn");
    const addToNomenclatureBtn = document.querySelector("#add-to-nomenclature-btn");
    const addDishModal = document.getElementById("add-dish-modal");
    const addDishForm = document.getElementById("add-dish-form");
    const cancelAddDishBtn = document.getElementById("cancel-add-dish-btn");
    const dishSelect = document.getElementById("dish-select");

    const addToCatalogModal = document.getElementById("add-to-catalog-modal");
    const addToCatalogForm = document.getElementById("add-to-catalog-form");
    const newDishNameInput = document.getElementById("new-dish-name");
    const dishTypeSelect = document.getElementById("catalog-dish-type-select");
    const cancelAddToCatalogBtn = document.getElementById("cancel-add-to-catalog-btn");
    
    // === Открытие модального окна для добавления блюда в номенклатуру ===
    addToNomenclatureBtn.addEventListener("click", () => {
        loadDishTypes(); // Загрузка типов блюд
        addToCatalogModal.classList.remove("hidden");
    });
    
    // === Закрытие модального окна ===
    cancelAddToCatalogBtn.addEventListener("click", () => {
        addToCatalogModal.classList.add("hidden");
    });
    
    addToCatalogForm.addEventListener("submit", async (e) => {
        e.preventDefault();
    
        const dishName = newDishNameInput.value.trim();
        const dishTypeId = parseInt(dishTypeSelect.value, 10);
    
        // Логи для отладки
        console.log("Название блюда:", dishName);
        console.log("Тип блюда ID:", dishTypeId);
    
        // Проверка на заполненность полей
        if (!dishName || isNaN(dishTypeId)) {
            alert("Пожалуйста, заполните все поля.");
            return;
        }
    
        try {
            const response = await fetch(`${apiUrl}/dish-catalog`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: dishName, type_id: dishTypeId }),
            });
    
            if (response.ok) {
                alert("Блюдо успешно добавлено в номенклатуру!");
                addToCatalogModal.classList.add("hidden");
                addToCatalogForm.reset(); // Очистка формы
                loadDishCatalog(); // Перезагрузить справочник блюд (если нужно)
            } else {
                const errorMessage = await response.text();
                alert(`Ошибка добавления блюда в номенклатуру: ${errorMessage}`);
            }
        } catch (err) {
            console.error("Ошибка добавления блюда в номенклатуру:", err);
            alert("Не удалось добавить блюдо в номенклатуру.");
        }
    });    
    

    // === Добавление нового варианта меню ===
    addVariantBtn.addEventListener("click", async () => {
        const dayOfWeekId = prompt("Введите ID дня недели (от 1 до 7):");
        const variantNumber = prompt("Введите номер варианта (число):");

        if (!dayOfWeekId || isNaN(dayOfWeekId) || !variantNumber || isNaN(variantNumber)) {
            alert("Пожалуйста, введите корректные данные.");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/menu-variants/${dayOfWeekId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ variant_number: parseInt(variantNumber, 10) }),
            });

            if (response.ok) {
                alert("Вариант меню успешно добавлен!");
                loadMenuVariantsWithCards(); // Перезагружаем список вариантов
            } else {
                const errorMessage = await response.text();
                alert(`Ошибка добавления варианта меню: ${errorMessage}`);
            }
        } catch (err) {
            console.error("Ошибка добавления варианта меню:", err);
            alert("Ошибка добавления варианта меню.");
        }
    });

    // === Загрузка справочника блюд ===
    async function loadDishCatalog() {
        try {
            const response = await fetch(`${apiUrl}/dish-catalog`);
            const data = await response.json();

            dishSelect.innerHTML = '<option value="">-- Выберите блюдо --</option>';
            data.forEach((dish) => {
                const option = document.createElement("option");
                option.value = dish.id;
                option.textContent = dish.name;
                dishSelect.appendChild(option);
            });
        } catch (err) {
            console.error("Ошибка загрузки справочника блюд:", err);
        }
    }

    // === Открытие модального окна для добавления блюда ===
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("add-dish-btn")) {
            const dayOfWeekId = e.target.getAttribute("data-day-of-week-id");
            const variantNumber = e.target.getAttribute("data-variant-number");

            addDishModal.dataset.dayOfWeekId = dayOfWeekId;
            addDishModal.dataset.variantNumber = variantNumber;

            loadDishCatalog();
            addDishModal.classList.remove("hidden");
        }
    });

    // === Закрытие модального окна ===
    cancelAddDishBtn.addEventListener("click", () => {
        addDishModal.classList.add("hidden");
    });

    // === Загрузка вариантов меню с карточками ===
        async function loadMenuVariantsWithCards() {
            try {
                const response = await fetch(`${apiUrl}/day-menu-variants`);
                const data = await response.json();
        
                // Очистить контейнер перед добавлением новых карточек
                menuVariantsContainer.innerHTML = "";
        
                // Проверяем, получены ли данные
                if (!Array.isArray(data) || data.length === 0) {
                    console.warn("Не удалось загрузить варианты меню или список пуст.");
                    menuVariantsContainer.innerHTML = "<p>Нет доступных вариантов меню.</p>";
                    return;
                }
        
                // Обработка каждого варианта меню
                data.forEach((variant, index) => {
                    console.log(`Обработка варианта ${index + 1}:`, variant);
        
                    const dayOfWeekId = variant.day_of_week_id;
                    const variantNumber = variant.variant_number;
                    const dayOfWeek = variant.day_of_week;
        
                    if (!dayOfWeekId || !variantNumber || !dayOfWeek) {
                        console.error("Один из параметров отсутствует:", variant);
                        return;
                    }
        
                    // Создание уникального идентификатора
                    const uniqueVariantId = `${dayOfWeekId}-${variantNumber}`;
        
                    // Создание карточки варианта меню
                    const variantCard = document.createElement("div");
                    variantCard.classList.add("menu-variant-card");
        
                    variantCard.innerHTML = `
                        <h3>${dayOfWeek}</h3>
                        <p>Вариант №${variantNumber}</p>
                        <ul class="dish-list" data-day-of-week-id="${dayOfWeekId}" data-variant-number="${variantNumber}">
                            <!-- Здесь будут загружены блюда -->
                        </ul>
                        <button class="add-dish-btn" data-day-of-week-id="${dayOfWeekId}" data-variant-number="${variantNumber}">Добавить блюдо</button>
                        <button class="delete-variant-btn" data-day-of-week-id="${dayOfWeekId}" data-variant-number="${variantNumber}">Удалить вариант</button>
                    `;
        
                    menuVariantsContainer.appendChild(variantCard);
        
                    // Загрузка блюд для текущего варианта
                    console.log(`Загрузка блюд для dayOfWeekId: ${dayOfWeekId}, variantNumber: ${variantNumber}`);
                    loadDishesForVariant(dayOfWeekId, variantNumber);
        
                    // Привязка обработчика для кнопки "Удалить вариант"
                    variantCard.querySelector(".delete-variant-btn").addEventListener("click", (e) => {
                        const dayOfWeekId = e.target.getAttribute("data-day-of-week-id");
                        const variantNumber = e.target.getAttribute("data-variant-number");
                        deleteMenuVariant(dayOfWeekId, variantNumber);
                    });
                });
        
                // Привязываем обработчики к кнопкам "Добавить блюдо"
                document.querySelectorAll('.add-dish-btn').forEach((button) => {
                    button.addEventListener('click', (e) => {
                        const dayOfWeekId = e.target.dataset.dayOfWeekId;
                        const variantNumber = e.target.dataset.variantNumber;
        
                        if (dayOfWeekId && variantNumber) {
                            openAddDishModal(dayOfWeekId, variantNumber);
                        }
                    });
                });
        
            } catch (err) {
                console.error("Ошибка загрузки вариантов меню:", err);
                menuVariantsContainer.innerHTML = "<p>Ошибка загрузки вариантов меню. Повторите попытку позже.</p>";
            }
        }
                 

// === Удаление варианта меню ===
async function deleteMenuVariant(dayId, variantNumber) {
    if (confirm("Вы уверены, что хотите удалить этот вариант меню?")) {
        try {
            const response = await fetch(`${apiUrl}/week-days/${dayId}/menu-variant/${variantNumber}`, {
                method: "DELETE",
            });

            if (response.ok) {
                alert("Вариант меню успешно удалён!");
                loadMenuVariantsWithCards(); // Перезагрузка вариантов меню
            } else {
                const errorMessage = await response.text();
                alert(`Ошибка удаления варианта меню: ${errorMessage}`);
            }
        } catch (err) {
            console.error("Ошибка удаления варианта меню:", err);
            alert("Не удалось удалить вариант меню. Попробуйте снова.");
        }
    }
}

// === Загрузка блюд для конкретного варианта меню ===
async function loadDishesForVariant(dayOfWeekId, variantNumber) {
    console.log(`Загрузка блюд для dayOfWeekId: ${dayOfWeekId}, variantNumber: ${variantNumber}`);

    const dishTypes = await loadDishTypes(); // Загрузка типов блюд

    try {
        // Используем dayOfWeekId и variantNumber в запросе
        const response = await fetch(`${apiUrl}/menu-variants/${dayOfWeekId}/${variantNumber}/dishes`);
        const data = await response.json();
    
        // Логи для отладки
        console.log("Полученные данные с сервера:", data);
    
        // Формируем уникальный идентификатор
        const uniqueVariantId = `${dayOfWeekId}-${variantNumber}`;

        // Ищем список блюд по уникальному идентификатору
        const dishList = document.querySelector(
            `.dish-list[data-day-of-week-id="${dayOfWeekId}"][data-variant-number="${variantNumber}"]`
        );        
        console.log("Dish list элемент:", dishList);
    
        if (!dishList) {
            console.error(`Не найден список блюд для variantNumber: ${variantNumber} и dayOfWeekId: ${dayOfWeekId}`);
            return; // Если элемент не найден, завершаем выполнение
        }
    
        dishList.innerHTML = ""; // Очистка списка
    
        if (data.length === 0) {
            dishList.innerHTML = "<li>Нет блюд</li>";
        } else {
            data.forEach((dish) => {
                const dishTypeName = dishTypes[dish.type_id] || "Неизвестный тип";
    
                const dishItem = document.createElement("li");
                dishItem.innerHTML = `
                    <span class="dish-text">${dish.name} (${dishTypeName})</span>
                    <div class="icon-container">
                        <img src="assets/move-icon.svg" class="move-dish-icon" data-dish-id="${dish.id}" alt="Перенести" title="Перенести">
                        <img src="assets/trash-icon.svg" class="delete-dish-icon" data-dish-id="${dish.id}" alt="Удалить" title="Удалить">
                    </div>
                `;
                dishList.appendChild(dishItem);
    
                // Обработчики событий для иконок
                dishItem.querySelector(".delete-dish-icon").addEventListener("click", () => {
                    deleteDish(dish.id, dayOfWeekId, variantNumber); // Удаление блюда
                });
    
                dishItem.querySelector(".move-dish-icon").addEventListener("click", async () => {
                    const targetDayOfWeekId = prompt("Введите ID дня недели:");
                    const targetVariantNumber = prompt("Введите номер варианта меню:");
    
                    if (!targetDayOfWeekId || !targetVariantNumber || isNaN(targetDayOfWeekId) || isNaN(targetVariantNumber)) {
                        alert("Некорректные данные.");
                        return;
                    }
    
                    try {
                        await moveDish(dish.id, targetDayOfWeekId, targetVariantNumber);
                        //alert("Блюдо успешно перенесено!");
                        loadDishesForVariant(dayOfWeekId, variantNumber);
                    } catch (err) {
                        console.error("Ошибка переноса блюда:", err);
                        alert("Не удалось перенести блюдо.");
                    }
                });
            });
        }
    } catch (err) {
        console.error("Ошибка загрузки блюд:", err);
    }
}

// === Открытие модального окна добавления блюда ===
function openAddDishModal(dayOfWeekId, variantNumber) {
    const addDishModal = document.getElementById("add-dish-modal");
    const addDishForm = document.getElementById("add-dish-form");
    const dishSelect = document.getElementById("dish-select");

    addDishModal.classList.remove("hidden");

    // Загрузка блюд из справочника
    loadDishCatalog();

    // Установка данных для формы
    addDishForm.dataset.dayOfWeekId = dayOfWeekId;
    addDishForm.dataset.variantNumber = variantNumber;

    // Обработчик отправки формы
    addDishForm.onsubmit = async (e) => {
        e.preventDefault();

        const dishCatalogId = dishSelect.value; // Используем dishCatalogId вместо dishId

        if (!dishCatalogId) {
            alert("Пожалуйста, выберите блюдо из списка.");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/menu-variants/${dayOfWeekId}/${variantNumber}/add-dish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dishCatalogId }), // Отправляем корректный параметр
            });

            if (response.ok) {
                alert("Блюдо успешно добавлено!");
                loadDishesForVariant(dayOfWeekId, variantNumber); // Перезагружаем блюда
                addDishModal.classList.add("hidden"); // Закрываем модальное окно
            } else {
                const errorMessage = await response.text();
                alert(`Ошибка добавления блюда: ${errorMessage}`);
            }
        } catch (err) {
            console.error("Ошибка добавления блюда:", err);
            alert("Ошибка добавления блюда");
        }
    };
}

// === Загрузка блюд из справочника ===
async function loadDishCatalog() {
    const dishSelect = document.getElementById("dish-select");

    try {
        const response = await fetch(`${apiUrl}/dish-catalog`);
        const data = await response.json();

        dishSelect.innerHTML = '<option value="">-- Выберите блюдо --</option>';
        data.forEach((dish) => {
            const option = document.createElement("option");
            option.value = dish.id;
            option.textContent = dish.name;
            dishSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Ошибка загрузки справочника блюд:", err);
    }
}

    // === Загрузка всех типов блюд ===
    async function loadDishTypes() {
        try {
            const response = await fetch(`${apiUrl}/dish-types`);
            const data = await response.json();
            const dishTypes = {};
            data.forEach((type) => {
                dishTypes[type.id] = type.type_name; // Создаем словарь { id: type_name }
            });
            return dishTypes;
        } catch (err) {
            console.error("Ошибка загрузки типов блюд:", err);
            return {};
        }
    }

// === Функция переноса блюда ===
async function moveDish(dishId, targetDayOfWeekId, targetVariantNumber) {
    try {
        const response = await fetch(`${apiUrl}/menu-variants/move-dishes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                dishIds: [dishId],
                targetDayOfWeekId: targetDayOfWeekId,
                targetVariantNumber: targetVariantNumber,
            }),
        });

        // Проверяем статус ответа
        if (!response.ok) {
            const errorResponse = await response.json(); // Если сервер возвращает JSON с ошибкой
            throw new Error(errorResponse.message || "Ошибка переноса блюда"); // Используем сообщение от сервера
        }

        // Если успешный ответ
        alert("Блюдо успешно перенесено!");
        // Обновляем список вариантов меню
        loadMenuVariantsWithCards();
    } catch (err) {
        console.error("Ошибка переноса блюда:", err.message || err);
        alert(`Ошибка переноса блюда: ${err.message || "Неизвестная ошибка"}`);
    }
}

// === Удаление блюда ===
async function deleteDish(dishId, dayOfWeekId, variantNumber) {
    if (confirm("Вы уверены, что хотите удалить это блюдо?")) {
        try {
            const response = await fetch(`${apiUrl}/dishes/${dishId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(errorMessage);
            }

            alert("Блюдо успешно удалено!");
            // Перезагружаем блюда для конкретного варианта
            loadDishesForVariant(dayOfWeekId, variantNumber, dishId);
        } catch (err) {
            console.error("Ошибка удаления блюда:", err);
            alert("Не удалось удалить блюдо. Попробуйте еще раз.");
        }
    }
}

    // === Добавление в номенклатуру ===
    /*addToNomenclatureBtn.addEventListener("click", async () => {
        const typeName = prompt("Введите название нового типа блюда:");

        if (!typeName) {
            alert("Название типа блюда не может быть пустым.");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/dish-types`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type_name: typeName }),
            });

            if (response.ok) {
                alert("Тип блюда успешно добавлен в номенклатуру!");
            } else {
                const errorMessage = await response.text();
                alert(`Ошибка добавления типа блюда: ${errorMessage}`);
            }
        } catch (err) {
            console.error("Ошибка добавления типа блюда:", err);
            alert("Ошибка добавления типа блюда.");
        }
    });*/
    
    // === Получение названия дня недели ===
    function getDayName(dayId) {
        const days = {
            1: "Понедельник",
            2: "Вторник",
            3: "Среда",
            4: "Четверг",
            5: "Пятница",
            6: "Суббота",
            7: "Воскресенье",
        };
        return days[dayId] || "Неизвестный день";
    }

    // === Инициализация ===
    loadMenuVariantsWithCards();

});