const BASE_URL = "https://perfume-store-abc123.onrender.com";

function loadOrders(start = "", end = "") {

    let url = BASE_URL + "/api/orders";

    if (start && end) {
        url += `?start=${start}&end=${end}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(data => {

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
                        <td>${order.date}</td>
                        <td>
                            <button onclick="deleteOrder(${order.id})">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;

                table.innerHTML += row;

                totalRevenue += order.price * order.quantity;
                totalQuantity += order.quantity;
            });

            document.getElementById("totalRevenue").textContent = "$" + totalRevenue;
            document.getElementById("totalQuantity").textContent = totalQuantity;
        });
}

function deleteOrder(id) {

    if (!confirm("Are you sure you want to delete this order?")) return;

    fetch(BASE_URL + "/api/orders/" + id, {
        method: "DELETE"
    })
    .then(() => loadOrders());
}

function filter() {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    loadOrders(start, end);
}

loadOrders();