const form = document.getElementById("formulario");
const mensaje = document.getElementById("mensaje");
const ticketBox = document.getElementById("ticket-box");
const spinner = document.getElementById("spinner");
const barraProgreso = document.querySelector(".relleno");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const cantidad = parseInt(document.getElementById("cantidad").value);

  if (!nombre || !correo || isNaN(cantidad) || cantidad < 1 || cantidad > 10) {
    mostrarMensaje("⚠️ Completa todos los campos correctamente.", "error");
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
      body: JSON.stringify({ nombre, correo, cantidad })
    });

    const data = await res.json();

    if (data.exito) {
      const numeros = data.numeros.map(n => n.toString().padStart(4, "0")).join(", ");
      escribirMensaje("¡Gracias por participar! Revisa tu correo.");

      ticketBox.innerHTML = `
        <h3>🎟️ Tus números:</h3>
        <p>${numeros}</p>
      `;
      ticketBox.classList.remove("hidden");

      // Actualizar barra de progreso si se está usando
      if (data.porcentaje) {
        actualizarBarra(data.porcentaje);
      }

      // Enviar correo con EmailJS
      await window.emailjs.send("service_fcgsd9j", "template_6qvu9xt", {
        to_email: correo,
        nombre: nombre,
        cantidad: cantidad,
        numeros: numeros
      });

      console.log("📧 Correo enviado con éxito");

    } else {
      mostrarMensaje("❌ Ocurrió un error. Intenta más tarde.", "error");
    }

  } catch (error) {
    console.error("Error:", error);
    mostrarMensaje("🚫 Error al conectar con el servidor.", "error");
  } finally {
    spinner.classList.add("hidden");
  }
});

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

    // Color dinámico según progreso
    if (porcentaje < 50) {
      barraProgreso.style.backgroundColor = "#4caf50"; // verde
    } else if (porcentaje < 90) {
      barraProgreso.style.backgroundColor = "#ff9800"; // naranja
    } else {
      barraProgreso.style.backgroundColor = "#f44336"; // rojo
    }
  }
}
