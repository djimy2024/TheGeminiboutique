function orderProduct(name, price, qtyId) {
    const quantity = document.getElementById(qtyId).value;

    fetch("http://localhost:3000/order", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            product: name,
            price: price,
            quantity: quantity
        })
    })
    .then(res => res.json())
    .then(data => {
        alert("Order sent !");
    });
}