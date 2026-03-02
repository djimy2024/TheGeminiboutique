const BASE_URL = "https://thegeminiboutique.onrender.com";

function loadOrders(start = "", end = "") {

    let url = BASE_URL + "/api/orders";

    if (start && end) {
        url += `?start=${start}&end=${end}`;
    }

    fetch(url, {
        credentials: "include"
    })
    .then(res => res.json())
    .then(data => {

        if (!Array.isArray(data)) {
            console.error("Not authorized or wrong response:", data);
            return;
        }

        const table = document.getElementById("ordersTable");
        table.innerHTML = "";

        let totalRevenue = 0;
        let totalQuantity = 0;

        document.getElementById("totalOrders").textContent = data.length;

        data.forEach(order => {

            const row = `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.product}</td>
                    <td>$${order.price}</td>
                    <td>${order.quantity}</td>
                    <td>${new Date(order.date).toLocaleString()}</td>
                    <td>
                        <button onclick="deleteOrder(${order.id})">
                            Delete
                        </button>
                    </td>
                </tr>
            `;

            table.innerHTML += row;

            totalRevenue += Number(order.price) * Number(order.quantity);
            totalQuantity += Number(order.quantity);
        });

        document.getElementById("totalRevenue").textContent = "$" + totalRevenue;
        document.getElementById("totalQuantity").textContent = totalQuantity;
    });
}

function deleteOrder(id) {

    if (!confirm("Are you sure you want to delete this order?")) return;

    fetch(BASE_URL + "/api/orders/" + id, {
        method: "DELETE",
        credentials: "include"
    })
    .then(() => loadOrders());
}

function filter() {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    loadOrders(start, end);
}


function exportExcel() {

    fetch(BASE_URL + "/export", {
        credentials: "include"
    })
    .then(response => response.blob())
    .then(blob => {

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "orders.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();

    })
    .catch(err => console.error("Export error:", err));
}

loadOrders();