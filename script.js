/* ==========================================
   VARIABLES Y ELEMENTOS
   ========================================== */
const botonesAgregar = document.querySelectorAll(".agregar");
const listaCarrito = document.getElementById("listaCarrito");
const totalHTML = document.getElementById("total");
const botonPagar = document.getElementById("pagar");
const contadorCarrito = document.getElementById("contadorCarrito");
const carritoAside = document.getElementById("carrito");

// Toast
const toast = document.getElementById("toast");
const toastMensaje = document.getElementById("toastMensaje");
const toastSeguir = document.getElementById("toastSeguir");
const toastVerCarrito = document.getElementById("toastVerCarrito");

/* ==========================================
   INVENTARIO INICIAL (stock máximo)
   ========================================== */
const stockInicial = {
    "Stainless Steel": 6,
    "Steel Back": 2,
    "Stainless Steel Back": 1,
    "Steel": 5
};

// Estado
let carrito = [];
let stockDisponible = { ...stockInicial };

/* ==========================================
   FUNCIONES DE STOCK
   ========================================== */
function calcularStockDisponible() {
    const stock = { ...stockInicial };
    carrito.forEach(item => {
        if (stock[item.nombre] !== undefined) {
            stock[item.nombre] -= item.cantidad;
            if (stock[item.nombre] < 0) stock[item.nombre] = 0;
        }
    });
    return stock;
}

function actualizarStockEnUI() {
    document.querySelectorAll(".card").forEach(card => {
        const boton = card.querySelector(".agregar");
        const nombre = boton.dataset.nombre;
        const spanStock = card.querySelector(".stock-cantidad");
        if (spanStock && nombre) {
            const disponible = stockDisponible[nombre] || 0;
            spanStock.textContent = disponible;
            if (disponible === 0) {
                spanStock.classList.add("agotado");
                boton.textContent = "❌ Sin stock";
                boton.classList.add("agotado");
                boton.disabled = true;
            } else {
                spanStock.classList.remove("agotado");
                boton.textContent = "Agregar al carrito";
                boton.classList.remove("agotado");
                boton.disabled = false;
            }
        }
    });
}

/* ==========================================
   CARGAR CARRITO DESDE LOCALSTORAGE
   ========================================== */
function cargarCarrito() {
    const guardado = localStorage.getItem("carritoRelojes");
    if (guardado) {
        try {
            carrito = JSON.parse(guardado);
        } catch (e) {
            carrito = [];
        }
    } else {
        carrito = [];
    }
    stockDisponible = calcularStockDisponible();
    actualizarStockEnUI();
    actualizarCarrito();
}
cargarCarrito();

/* ==========================================
   GUARDAR CARRITO
   ========================================== */
function guardarCarrito() {
    localStorage.setItem("carritoRelojes", JSON.stringify(carrito));
    stockDisponible = calcularStockDisponible();
    actualizarStockEnUI();
}

/* ==========================================
   AGREGAR PRODUCTO (con control de stock)
   ========================================== */
function agregarProducto(nombre, precio) {
    if (stockDisponible[nombre] <= 0) {
        mostrarToast(`❌ No hay stock de ${nombre}`);
        return;
    }

    const existe = carrito.find(p => p.nombre === nombre);
    if (existe) {
        if (stockDisponible[nombre] > 0) {
            existe.cantidad++;
        } else {
            mostrarToast(`❌ No hay stock suficiente de ${nombre}`);
            return;
        }
    } else {
        carrito.push({ nombre, precio, cantidad: 1 });
    }

    guardarCarrito();
    actualizarCarrito();
    mostrarToast(`✅ ${nombre} agregado (stock restante: ${stockDisponible[nombre]})`);
    carritoAside.classList.add("actualizado");
    setTimeout(() => carritoAside.classList.remove("actualizado"), 500);
}

/* ==========================================
   ACTUALIZAR INTERFAZ DEL CARRITO
   ========================================== */
function actualizarCarrito() {
    listaCarrito.innerHTML = "";
    if (carrito.length === 0) {
        listaCarrito.innerHTML = `<p class="vacio">No hay productos agregados.</p>`;
        contadorCarrito.textContent = "(0)";
        calcularTotal();
        return;
    }

    carrito.forEach((producto, index) => {
        const item = document.createElement("div");
        item.classList.add("item");
        item.innerHTML = `
            <div class="itemInfo">
                <h4>${producto.nombre}</h4>
                <span>S/${producto.precio.toFixed(2)}</span>
                <div class="cantidad">
                    <button onclick="disminuirCantidad(${index})">−</button>
                    <strong>${producto.cantidad}</strong>
                    <button onclick="aumentarCantidad(${index})">+</button>
                </div>
            </div>
            <button class="eliminar" onclick="eliminarProducto(${index})">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        listaCarrito.appendChild(item);
    });

    const totalItems = carrito.reduce((acc, p) => acc + p.cantidad, 0);
    contadorCarrito.textContent = `(${totalItems})`;
    calcularTotal();
}

/* ==========================================
   FUNCIONES DE CANTIDAD
   ========================================== */
function aumentarCantidad(index) {
    const producto = carrito[index];
    if (stockDisponible[producto.nombre] > 0) {
        producto.cantidad++;
        guardarCarrito();
        actualizarCarrito();
    } else {
        mostrarToast(`❌ No hay más stock de ${producto.nombre}`);
    }
}

function disminuirCantidad(index) {
    const producto = carrito[index];
    producto.cantidad--;
    if (producto.cantidad <= 0) {
        carrito.splice(index, 1);
    }
    guardarCarrito();
    actualizarCarrito();
}

function eliminarProducto(index) {
    carrito.splice(index, 1);
    guardarCarrito();
    actualizarCarrito();
}

/* ==========================================
   CALCULAR TOTAL
   ========================================== */
function calcularTotal() {
    let total = 0;
    carrito.forEach(p => total += p.precio * p.cantidad);
    totalHTML.textContent = "S/" + total.toFixed(2);
}

/* ==========================================
   TOAST
   ========================================== */
let toastTimeout = null;

function mostrarToast(mensaje) {
    toastMensaje.textContent = mensaje;
    toast.classList.add("visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("visible");
    }, 4000);
}

toastSeguir.addEventListener("click", () => {
    toast.classList.remove("visible");
    clearTimeout(toastTimeout);
});

toastVerCarrito.addEventListener("click", () => {
    toast.classList.remove("visible");
    clearTimeout(toastTimeout);
    document.getElementById("carrito").scrollIntoView({ behavior: "smooth" });
});

/* ==========================================
   EVENTOS DE BOTONES AGREGAR
   ========================================== */
botonesAgregar.forEach(boton => {
    boton.addEventListener("click", function () {
        const nombre = this.dataset.nombre;
        const precio = Number(this.dataset.precio);
        agregarProducto(nombre, precio);

        // Cambio temporal del botón
        if (stockDisponible[nombre] >= 0) {
            const textoOriginal = this.textContent;
            this.textContent = "✅ Agregado";
            this.classList.add("agregado");
            setTimeout(() => {
                if (stockDisponible[nombre] > 0) {
                    this.textContent = textoOriginal;
                    this.classList.remove("agregado");
                } else {
                    this.textContent = "❌ Sin stock";
                    this.classList.add("agotado");
                    this.disabled = true;
                }
            }, 2000);
        }
    });
});

/* ==========================================
   WHATSAPP – SIN NOMBRE NI DIRECCIÓN
   ========================================== */
botonPagar.addEventListener("click", () => {
    if (carrito.length === 0) {
        alert("🛒 Agrega al menos un producto al carrito.");
        return;
    }

    let mensaje = "🛒 *NUEVO PEDIDO DE RELOJES*%0A%0A";
    let total = 0;

    carrito.forEach(p => {
        const subtotal = p.precio * p.cantidad;
        total += subtotal;
        mensaje += `⌚ *${p.nombre}*%0A`;
        mensaje += `Cantidad: ${p.cantidad}%0A`;
        mensaje += `Subtotal: S/${subtotal.toFixed(2)}%0A%0A`;
    });

    mensaje += `━━━━━━━━━━━━━━%0A`;
    mensaje += `💰 *TOTAL:* S/${total.toFixed(2)}%0A%0A`;
    mensaje += `Hola, deseo realizar este pedido.`;

    const numero = "51967483151";
    const url = `https://wa.me/${numero}?text=${mensaje}`;
    window.open(url, "_blank");
});