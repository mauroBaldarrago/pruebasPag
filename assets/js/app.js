document.addEventListener("DOMContentLoaded", () => {

    // ================= UTILIDADES =================
    function getUsuarioLogueado() {
        return localStorage.getItem("usuarioLogueado");
    }

    async function getNombreUsuario() {
        const correo = getUsuarioLogueado();
        if (!correo) return null;
        try {
            const res = await fetch(`api.php?action=getUsuario&correo=${correo}`);
            const data = await res.json();
            return data.usuario || correo;
        } catch (err) {
            console.error(err);
            return correo;
        }
    }

    async function obtenerNotas() {
        const correo = getUsuarioLogueado();
        if (!correo) return [];
        try {
            const res = await fetch(`api.php?action=getNotas&correo=${correo}`);
            const data = await res.json();
            return data || [];
        } catch (err) {
            console.error("Error al obtener notas:", err);
            return [];
        }
    }

    async function guardarNotas(nota) {
        const correo = getUsuarioLogueado();
        if (!correo) return false;
        try {
            const res = await fetch('api.php?action=addNota', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, ...nota })
            });
            const data = await res.json();
            return data.ok;
        } catch (err) {
            console.error("Error al guardar nota:", err);
            return false;
        }
    }

    async function actualizarNota(nota) {
        try {
            const res = await fetch('api.php?action=updateNota', {
                method:'POST',
                headers:{ 'Content-Type':'application/json' },
                body: JSON.stringify(nota)
            });
            await res.json();
        } catch(err) { console.error(err); }
    }

    async function eliminarNota(id) {
        try {
            const res = await fetch('api.php?action=deleteNota', {
                method:'POST',
                headers:{ 'Content-Type':'application/json' },
                body: JSON.stringify({ id })
            });
            await res.json();
        } catch(err) { console.error(err); }
    }

    async function registrarUsuario(nombre, correo, clave) {
        try {
            const res = await fetch('api.php?action=addUsuario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, correo, clave, plan: "normal" })
            });
            const data = await res.json();
            return data.ok;
        } catch (err) {
            console.error("Error al registrar usuario:", err);
            return false;
        }
    }

    async function loginUsuario(correo, clave) {
        try {
            const res = await fetch('api.php?action=login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, clave })
            });
            const data = await res.json();
            return data.ok;
        } catch (err) {
            console.error("Error al iniciar sesión:", err);
            return false;
        }
    }

    // ================= PROTECCIÓN DE RUTA =================
    if (document.title.includes("Notas") && !getUsuarioLogueado()) {
        window.location.href = "pag_IniciarSesion.html";
    }

    // ================= REGISTRO =================
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async e => {
            e.preventDefault();
            const usuario = document.getElementById("usuario").value.trim();
            const correo = document.getElementById("correo").value.trim();
            const clave = document.getElementById("clave").value;
            const ok = await registrarUsuario(usuario, correo, clave);
            if (ok) {
                alert("Cuenta creada correctamente. Ahora inicia sesión.");
                window.location.href = "pag_IniciarSesion.html";
            } else {
                alert("Error: Este correo ya está registrado o hubo un problema.");
            }
        });
    }

    // ================= LOGIN =================
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async e => {
            e.preventDefault();
            const correo = document.getElementById("correo").value.trim();
            const clave = document.getElementById("clave").value;
            const ok = await loginUsuario(correo, clave);
            if (ok) {
                localStorage.setItem("usuarioLogueado", correo);
                window.location.href = "notas.html";
            } else {
                alert("Correo o contraseña incorrectos");
            }
        });
    }

    // ================= MOSTRAR NOTAS =================
    const notaForm = document.getElementById("notaForm");
    const listaNotas = document.getElementById("listaNotas");

    async function mostrarNotas() {
        const usuario = getUsuarioLogueado();
        if (!listaNotas || !usuario) return;

        const notas = await obtenerNotas();
        listaNotas.innerHTML = "";
        if (!notas.length) return;

        notas.forEach((nota, index) => {
            const li = document.createElement("li");
            li.classList.add("nota-item");

            let icono = "📝";
            if (nota.tipo === "tarea") icono = "✅";
            if (nota.tipo === "recordatorio") icono = "⏰";

            const texto = document.createElement("span");
            texto.textContent = `${icono} ${nota.texto}`;
            texto.classList.add("nota-texto");
            texto.style.color = nota.color || "black";

            if (nota.tipo === "tarea" && nota.completada) texto.classList.add("nota-completada");

            if (nota.tipo === "tarea") {
                texto.classList.add("nota-tarea");
                texto.addEventListener("click", async () => {
                    nota.completada = !nota.completada;
                    await actualizarNota({ id: nota.id, completada: nota.completada ? 1 : 0 });
                    mostrarNotas();
                });
            }

            const fecha = document.createElement("span");
            fecha.textContent = nota.fecha;
            fecha.classList.add("nota-fecha");

            const eliminar = document.createElement("span");
            eliminar.textContent = "Eliminar";
            eliminar.classList.add("nota-eliminar");
            eliminar.addEventListener("click", async () => {
                await eliminarNota(nota.id);
                mostrarNotas();
            });

            let fechaExtraText = "";
            let fechaExtraColor = "#555";
            if(nota.fechaRecordatorio){
                const partes = nota.fechaRecordatorio.split("-");
                if(partes.length === 3){
                    const fechaObj = new Date(partes[0], partes[1]-1, partes[2]);
                    const hoy = new Date(); hoy.setHours(0,0,0,0);
                    if(fechaObj.getTime() === hoy.getTime()) fechaExtraColor = "#e74c3c";
                    else if(fechaObj.getTime() < hoy.getTime()) fechaExtraColor = "#c0392b";
                    fechaExtraText = `Día: ${partes[2]}/${partes[1]}/${partes[0]}`;
                }
            }

            const fechaExtra = document.createElement("span");
            fechaExtra.textContent = fechaExtraText;
            fechaExtra.classList.add("nota-fecha-extra");
            fechaExtra.style.color = fechaExtraColor;

            li.append(texto, fechaExtra, fecha, eliminar);
            listaNotas.appendChild(li);
        });
    }

    // ================= SUBMIT NOTA =================
    if (notaForm) {
        notaForm.addEventListener("submit", async e => {
            e.preventDefault();
            const texto = document.getElementById("notaTexto").value.trim();
            if (!texto) return;

            const tipo = document.getElementById("tipoNota").value;
            const fechaRecordatorio = (tipo === "recordatorio") ? document.getElementById("fechaRecordatorio").value || "" : "";

            // Límite de recordatorios
            const notasExistentes = await obtenerNotas();
            const correo = getUsuarioLogueado();
            const resUser = await fetch(`api.php?action=getUsuario&correo=${correo}`);
            const usuarioObj = await resUser.json();
            const plan = usuarioObj.plan || "normal";
            const recordatoriosExistentes = notasExistentes.filter(n => n.tipo === "recordatorio").length;
            if(tipo === "recordatorio" && plan==="normal" && recordatoriosExistentes>=5){
                alert("Has alcanzado el máximo de 5 recordatorios para el plan Normal. Actualiza a Premium para ilimitados.");
                return;
            }

            const nota = {
                texto,
                tipo,
                fecha: new Date().toLocaleDateString(),
                fechaRecordatorio,
                completada: false,
                color: colorSeleccionado
            };

            await guardarNotas(nota);
            notaForm.reset();
            mostrarNotas();
        });
        mostrarNotas();
    }

    // ================= LOGOUT =================
    const btnLogout = document.getElementById("btnLogout");
    if(btnLogout) btnLogout.addEventListener("click", () => {
        localStorage.removeItem("usuarioLogueado");
        window.location.href="pag_IniciarSesion.html";
    });

    // ================= CAMPOS DINÁMICOS =================
    const tipoNotaSelect = document.getElementById("tipoNota");
    const fechaRecordatorioInput = document.getElementById("recordatorioFechaContainer");
    if(tipoNotaSelect && fechaRecordatorioInput){
        tipoNotaSelect.addEventListener("change", ()=>{
            fechaRecordatorioInput.style.display = (tipoNotaSelect.value==="recordatorio")?"block":"none";
        });
    }

    // ================= COLORES PREMIUM =================
    let colorSeleccionado="black";
    const colorCirculos = document.querySelectorAll(".color-circle");
    colorCirculos.forEach(c=>{
        c.addEventListener("click", async ()=>{
            const correo = getUsuarioLogueado();
            const res = await fetch(`api.php?action=getUsuario&correo=${correo}`);
            const usuarioObj = await res.json();
            if(usuarioObj.plan!=="premium"){
                alert("Solo los usuarios Premium pueden seleccionar colores personalizados.");
                return;
            }
            colorCirculos.forEach(c2=>c2.classList.remove("selected"));
            c.classList.add("selected");
            colorSeleccionado=c.dataset.color;
        });
    });

    // ================= USER MENU =================
    const userName = document.getElementById("userName");
    const userMenu = document.querySelector(".user-menu");
    if(userName && userMenu){
        userName.addEventListener("click", e=>{
            e.stopPropagation();
            userMenu.classList.toggle("open");
        });
        document.addEventListener("click", ()=>userMenu.classList.remove("open"));
    }

    // ================= PLAN PREMIUM =================
    const btnPremium = document.getElementById("btnPremium");
    if(btnPremium){
        btnPremium.addEventListener("click", async ()=>{
            const correo = getUsuarioLogueado();
            if(!correo){
                alert("Debes iniciar sesión para activar el Plan Premium");
                window.location.href = "pag_IniciarSesion.html";
                return;
            }
            await fetch(`api.php?action=activarPremium&correo=${correo}`);
            alert("Plan Premium activado correctamente");
            location.reload();
        });
    }

    // ================= CARGAR HEADER =================
    (async ()=>{
        const nombre = await getNombreUsuario();
        const correo = getUsuarioLogueado();
        const btnsNoAuth = document.querySelectorAll(".auth-no");
        const btnsAuth = document.querySelectorAll(".auth-yes");
        const userNameSpan = document.getElementById("userName");
        if(!correo){
            btnsNoAuth.forEach(b=>b.style.display="inline-block");
            btnsAuth.forEach(b=>b.style.display="none");
        } else{
            btnsNoAuth.forEach(b=>b.style.display="none");
            btnsAuth.forEach(b=>b.style.display="inline-block");
            if(userNameSpan) userNameSpan.textContent=`Hola, ${nombre}`;
        }
    })();

});
