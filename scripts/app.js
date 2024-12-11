// =================== Variables Globales ===================
const API_BASE_URL = "http://localhost:8080/FinanzasAplication/gastos";
const tableBody = document.querySelector("#expenses-table tbody");
const filterMain = document.getElementById("filter-main");
const filterCategory = document.getElementById("filter-category");
const filterButton = document.getElementById("apply-filters");
const totalButton = document.getElementById("calculate-total");
const totalDisplay = document.getElementById("total-display");
const categorySelect = document.getElementById("category-select");
const categoryButton = document.getElementById("calculate-category-total");
const categoryTotalDisplay = document.getElementById("category-total-display");

// =================== Funciones ===================
async function autoLogin() {
    const credentials = {
        username: "admin",
        password: "password"
    };

    try {
        const response = await fetch("http://localhost:8080/FinanzasAplication/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials)
        });

        if (response.ok) {
            const data = await response.json();
            const token = data.token; // Asegúrate de que el backend devuelve el token con esta clave
            localStorage.setItem("jwtToken", token); // Guardar token en localStorage
            console.log("Login exitoso. Token guardado:", token);
        } else {
            console.error("Error en el login:", response.statusText);
            alert("Error al autenticar. Revisa el backend.");
        }
    } catch (error) {
        console.error("Error durante el login:", error);
    }
}
function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
        console.error("No se encontró el token. Por favor, haz login.");
        return Promise.reject("No token available");
    }

    const authHeaders = {
        ...options.headers,
        Authorization: `Bearer ${token}` // Agregar el token en el encabezado
    };

    return fetch(url, { ...options, headers: authHeaders });
}

// Función: Añadir un nuevo gasto (POST)
function addExpense(event) {
    event.preventDefault();

    const description = document.getElementById("description").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const expenseType = document.getElementById("type").value;

    const expenseData = {
        description: description,
        amount: amount,
        expenseType: expenseType
    };

    // Recuperar el token desde localStorage
    const token = localStorage.getItem("jwtToken");

    // Usar authenticatedFetch para incluir el token en la solicitud
    authenticatedFetch(API_BASE_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json", // Asegurar encabezado JSON
            "Authorization": `Bearer ${token}` // Incluir el token en el encabezado
        },
        body: JSON.stringify(expenseData) // Incluir el cuerpo de la solicitud
    })
        .then(response => {
            if (response.ok) {
                alert("Gasto añadido correctamente.");
                document.getElementById("expense-form").reset();
                fetchAllExpenses(); // Refrescar la tabla
            } else {
                return response.json().then(error => {
                    console.error("Error del servidor:", error);
                    alert("Error al añadir el gasto.");
                });
            }
        })
        .catch(error => {
            console.error("Error en la solicitud:", error);
            alert("No se pudo conectar al servidor.");
        });
}


// Función: Obtener todos los gastos (GET /gastos)
async function fetchAllExpenses() {
    try {
        const response = await authenticatedFetch(API_BASE_URL);
        if (!response.ok) throw new Error("Error al obtener todos los gastos");
        const expenses = await response.json();
        renderExpenses(expenses);
    } catch (error) {
        console.error("Error:", error);
        alert("No se pudieron cargar los gastos.");
    }
}

// Función: Obtener gastos hormiga (GET /micro)
async function fetchMicroExpenses() {
    try {

        const token = localStorage.getItem("jwtToken");
        console.log("Token recuperado del localStorage:", token);

        // Realizar la solicitud utilizando authenticatedFetch
        const response = await authenticatedFetch(`${API_BASE_URL}/micro`);
        console.log("Respuesta recibida del servidor:", response);

        // Verificar si la respuesta es válida
        if (!response.ok) {
            console.error("Error al obtener gastos hormiga. Estado:", response.status, response.statusText);
            throw new Error("Error al obtener gastos hormiga");
        }

        // Parsear el JSON de la respuesta
        const expenses = await response.json();
        console.log("Datos obtenidos de la API (gastos hormiga):", expenses);

        // Renderizar los gastos en la tabla
        renderExpenses(expenses);
        console.log("Gastos hormiga renderizados correctamente.");
    } catch (error) {
        console.error("Error en la solicitud fetchMicroExpenses:", error);
        alert("No se pudieron cargar los gastos hormiga.");
    }
}


// Función: Obtener gastos mayoritarios (GET /high)
async function fetchHighExpenses() {
    try {
        // Recuperar el token desde localStorage (se añade este paso)
        const token = localStorage.getItem("jwtToken");

        // Usar authenticatedFetch para incluir el token en el encabezado Authorization (se cambia fetch por authenticatedFetch)
        const response = await authenticatedFetch(`${API_BASE_URL}/high`, {
            method: "GET", // Asegurar el método GET
            headers: { "Content-Type": "application/json" } // Incluir encabezados básicos
        });

        // Verificar si la respuesta es válida
        if (!response.ok) throw new Error("Error al obtener gastos mayoritarios");

        // Parsear la respuesta JSON
        const expenses = await response.json();

        // Renderizar los gastos en la tabla
        renderExpenses(expenses);
    } catch (error) {
        // Manejo de errores
        console.error("Error:", error);
        alert("No se pudieron cargar los gastos mayoritarios.");
    }
}


// Función: Renderizar los gastos en la tabla
function renderExpenses(expenses) {
    tableBody.innerHTML = "";
    expenses.forEach(expense => {
        const row = `
            <tr data-id="${expense.idExpense}">
                <td>${expense.idExpense}</td>
                <td class="editable description">${expense.description}</td>
                <td class="editable amount">${expense.amount}</td>
                <td class="editable type">${expense.expenseType}</td>
                <td>
                    <button class="edit-btn">Editar</button>
                    <button class="delete-btn">Eliminar</button>
                </td>
            </tr>
        `;
        tableBody.insertAdjacentHTML("beforeend", row);
    });

    assignRowEvents();
}

// Función: Asignar eventos a los botones de cada fila
function assignRowEvents() {
    tableBody.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", () => {
            const row = button.closest("tr");
            enableRowEditing(row);
        });
    });
    tableBody.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", () => {
            const idExpense = button.closest("tr").dataset.id;
            deleteExpense(idExpense);
        });
    });
}

// Función: Hacer que una fila sea editable
function enableRowEditing(row) {
    const descriptionCell = row.querySelector(".description");
    const amountCell = row.querySelector(".amount");
    const typeCell = row.querySelector(".type");

    // Convertir celdas en inputs o selects
    descriptionCell.innerHTML = `<input type="text" value="${descriptionCell.textContent}" />`;
    amountCell.innerHTML = `<input type="number" value="${amountCell.textContent}" />`;
    typeCell.innerHTML = `
        <select>
            <option value="comida" ${typeCell.textContent === "comida" ? "selected" : ""}>Comida</option>
            <option value="transporte" ${typeCell.textContent === "transporte" ? "selected" : ""}>Transporte</option>
            <option value="entretenimiento" ${typeCell.textContent === "entretenimiento" ? "selected" : ""}>Entretenimiento</option>
            <option value="servicio" ${typeCell.textContent === "servicio" ? "selected" : ""}>Servicio</option>
            <option value="general" ${typeCell.textContent === "general" ? "selected" : ""}>General</option>
        </select>
    `;

    // Cambiar botones a "Guardar" y "Cancelar"
    const actionsCell = row.querySelector("td:last-child");
    actionsCell.innerHTML = `
        <button class="save-btn">Guardar</button>
        <button class="cancel-btn">Cancelar</button>
    `;

    // Asignar eventos a los nuevos botones
    actionsCell.querySelector(".save-btn").addEventListener("click", () => saveRowEditing(row));
    actionsCell.querySelector(".cancel-btn").addEventListener("click", () => cancelRowEditing(row));
}

// Función: Guardar los cambios en la fila
function saveRowEditing(row) {
    const idExpense = parseInt(row.dataset.id);
    const description = row.querySelector(".description input").value;
    const amount = parseFloat(row.querySelector(".amount input").value);
    const expenseType = row.querySelector(".type select").value;

    const updatedExpense = {
        description: description,
        amount: amount,
        expenseType: expenseType
    };

    // Recuperar el token desde localStorage
    const token = localStorage.getItem("jwtToken");

    // Usar authenticatedFetch para incluir el token en la solicitud
    authenticatedFetch(`${API_BASE_URL}/${idExpense}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json", // Asegurar encabezado JSON
            "Authorization": `Bearer ${token}` // Incluir el token en el encabezado
        },
        body: JSON.stringify(updatedExpense) // Incluir el cuerpo de la solicitud
    })
        .then(response => {
            if (response.ok) {
                alert("Gasto actualizado correctamente.");
                fetchAllExpenses(); // Refrescar la tabla
            } else {
                return response.json().then(error => {
                    console.error("Error del servidor:", error);
                    alert("Error al actualizar el gasto.");
                });
            }
        })
        .catch(error => {
            console.error("Error en la solicitud:", error);
            alert("No se pudo conectar al servidor.");
        });
}


// Función: Cancelar edición de una fila
function cancelRowEditing(row) {
    fetchAllExpenses(); // Volver a cargar los datos desde el backend
}

// Función: Eliminar un gasto (DELETE)
function deleteExpense(idExpense) {
    // Recuperar el token desde localStorage
    const token = localStorage.getItem("jwtToken");

    // Usar authenticatedFetch para incluir el token en la solicitud
    authenticatedFetch(`${API_BASE_URL}/${idExpense}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}` // Agregar el token al encabezado
        }
    })
        .then(response => {
            if (response.ok) {
                alert("Gasto eliminado correctamente.");
                fetchAllExpenses();
            } else {
                console.error("Error al eliminar el gasto.");
            }
        })
        .catch(error => {
            console.error("Error en la solicitud:", error);
        });
}



// Función: Obtener suma total de gastos (GET /gastos/total)
async function fetchTotalExpenses() {
    try {
        // Recuperar el token desde localStorage
        const token = localStorage.getItem("jwtToken");

        // Usar authenticatedFetch para incluir el token en la solicitud
        const response = await authenticatedFetch(`${API_BASE_URL}/total`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Error al obtener la suma total");
        }

        // Parsear la respuesta JSON
        const total = await response.json();

        // Mostrar el total en el frontend
        totalDisplay.textContent = `Total: ${total} €`;
    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo obtener la suma total de gastos.");
    }
}


// Función: Obtener suma por categoría (GET /gastos/tipo/{expenseType})
async function fetchTotalByCategory() {
    const selectedCategory = categorySelect.value;

    if (!selectedCategory) {
        alert("Por favor, selecciona una categoría.");
        return;
    }

    try {
        // Recuperar el token desde localStorage
        const token = localStorage.getItem("jwtToken");

        // Usar authenticatedFetch para incluir el token en la solicitud
        const response = await authenticatedFetch(`${API_BASE_URL}/tipo/${selectedCategory}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json", // Asegurar encabezado JSON
                "Authorization": `Bearer ${token}` // Incluir el token en el encabezado
            }
        });

        if (!response.ok) throw new Error(`Error al obtener la suma de la categoría: ${selectedCategory}`);
        const total = await response.json();

        // Mostrar el total en el frontend
        categoryTotalDisplay.textContent = `Total por Categoría: ${total} €`;
    } catch (error) {
        console.error("Error:", error);
        alert(`No se pudo obtener la suma de la categoría: ${selectedCategory}`);
    }
}

async function fetchExpensesByCategory(expenseType) {
    try {
        if (!expenseType) {
            alert("Por favor, selecciona una categoría válida.");
            return;
        }

        // Recuperar el token desde localStorage
        const token = localStorage.getItem("jwtToken");

        // Usar authenticatedFetch para incluir el token en la solicitud
        const response = await authenticatedFetch(`${API_BASE_URL}/agrupados/${expenseType}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json", // Asegurar encabezado JSON
                "Authorization": `Bearer ${token}` // Incluir el token en el encabezado
            }
        });

        if (!response.ok) throw new Error(`Error al obtener los gastos de categoría: ${expenseType}`);
        const expenses = await response.json();

        // Renderizar los gastos en la tabla
        renderExpenses(expenses);
    } catch (error) {
        console.error("Error:", error);
        alert(`No se pudieron cargar los gastos de la categoría: ${expenseType}`);
    }
}


// =================== Eventos ===================
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Realizar login automático
    await autoLogin();

    // 2. Si el login es exitoso, cargar datos iniciales
    fetchAllExpenses(); // Cargar todos los gastos al inicio

    // 3. Asignar eventos de filtros
    filterButton.addEventListener("click", () => {
        const selectedFilter = filterMain.value;

        if (selectedFilter === "all") {
            fetchAllExpenses();
        } else if (selectedFilter === "micro") {
            fetchMicroExpenses();
        } else if (selectedFilter === "high") {
            fetchHighExpenses();
        }
    });

    // 4. Asignar eventos para filtro por categoría
    filterCategory.addEventListener("change", () => {
        const selectedCategory = filterCategory.value;

        if (selectedCategory) {
            fetchExpensesByCategory(selectedCategory); // Llama a la función con la categoría seleccionada
        } else {
            alert("Por favor, selecciona una categoría válida.");
        }
    });

    // 5. Evento para el formulario de agregar gasto
    const form = document.getElementById("expense-form");
    form.addEventListener("submit", addExpense);

    // 6. Eventos para cálculos
    totalButton.addEventListener("click", fetchTotalExpenses);
    categoryButton.addEventListener("click", fetchTotalByCategory);

    // 7. Evento para la navegación
    const navLinks = document.querySelectorAll(".navbar ul li a");
    const sections = document.querySelectorAll("main > section, header");

    navLinks.forEach(link => {
        link.addEventListener("click", (event) => {
            event.preventDefault();

            // Ocultar todas las secciones
            sections.forEach(section => section.classList.add("hidden"));

            // Mostrar la sección correspondiente
            const target = event.target.dataset.section;
            document.getElementById(target).classList.remove("hidden");
        });
    });
});
