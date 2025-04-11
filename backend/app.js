const form = document.getElementById("formulario");
const mensaje = document.getElementById("mensaje");
const ticketBox = document.getElementById("ticket-box");
const spinner = document.getElementById("spinner");
const barraProgreso = document.querySelector(".relleno");

// 📥 Escuchar envío de formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const numerosSeleccionados = obtenerNumerosSeleccionados(); // ["001", "045", ...]

  // Validaciones
  if (!nombre || !correo) {
    mostrarMensaje("⚠️ Completa todos los campos correctamente.", "error");
    return;
  }

  if (numerosSeleccionados.length < 1 || numerosSeleccionados.length > 20) {
    mostrarMensaje("⚠️ Debes seleccionar entre 1 y 20 números.", "error");
    return;
  }

  // Reiniciar estados visuales
  spinner.classList.remove("hidden");
  mensaje.textContent = "";
  ticketBox.classList.add("hidden");

  try {
    const res = await fetch("http://localhost:5000/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, correo, numeros: numerosSeleccionados })
    });

    const data = await res.json();

    if (data.exito) {
      const numeros = data.numeros.join(", ");
      escribirMensaje("¡Gracias por participar! Revisa tu correo.");

      ticketBox.innerHTML = `
        <h3>🎟️ Tus números:</h3>
        <p>${numeros}</p>
      `;
      ticketBox.classList.remove("hidden");

      if (data.porcentaje) {
        actualizarBarra(data.porcentaje);
      }

      // Enviar correo
      await window.emailjs.send("service_fcgsd9j", "template_6qvu9xt", {
        to_email: correo,
        nombre: nombre,
        cantidad: numerosSeleccionados.length,
        numeros: numeros
      });

      console.log("📧 Correo enviado con éxito");

    } else {
      mostrarMensaje(data.mensaje || "❌ Ocurrió un error. Intenta más tarde.", "error");
    }

  } catch (error) {
    console.error("Error:", error);
    mostrarMensaje("🚫 Error al conectar con el servidor.", "error");
  } finally {
    spinner.classList.add("hidden");
  }
});

// ✅ Obtener los números seleccionados por el usuario
function obtenerNumerosSeleccionados() {
  return Array.from(document.querySelectorAll(".numero.seleccionado"))
    .map(btn => btn.textContent.trim());
}

// 🟢 Mostrar mensaje con estilo animado
function mostrarMensaje(texto, tipo = "exito") {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
}

// ✨ Efecto máquina de escribir solo para éxito
function escribirMensaje(texto) {
  mensaje.textContent = "";
  mensaje.className = "mensaje exito";
  let i = 0;
  const intervalo = setInterval(() => {
    mensaje.textContent += texto.charAt(i);
    i++;
    if (i >= texto.length) clearInterval(intervalo);
  }, 40);
}

// 📊 Actualizar barra de progreso
function actualizarBarra(porcentaje) {
  if (barraProgreso) {
    barraProgreso.style.width = `${porcentaje}%`;

    if (porcentaje < 50) {
      barraProgreso.style.backgroundColor = "#f44336"; // rojo
    } else if (porcentaje < 90) {
      barraProgreso.style.backgroundColor = "#ff9800"; // naranja
    } else {
      barraProgreso.style.backgroundColor = "#4caf50"; // verde
    }
  }
}
// 📊 Cargar barra de progreso al iniciar la página
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("http://localhost:5000/api/tickets/consulta");
    const data = await res.json();

    if (data.exito && data.porcentaje !== undefined) {
      actualizarBarra(data.porcentaje);
    } else {
      console.warn("⚠️ No se pudo obtener el porcentaje inicial:", data.mensaje);
    }
  } catch (error) {
    console.error("❌ Error al cargar el porcentaje inicial:", error);
  }
});
