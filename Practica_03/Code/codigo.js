// Variables para el cronómetro
let tiempoTranscurrido = 0;
let intervalId = null;
let cronometroActivo = false;
let celdas = [];
let juegoActivo = false;
let puntos = 0;
let tetosActivos = [];
let dificultad = 1;
let tiempoParaTeto = 3000;
let numeroTetos = 1;
let timeoutsTeto = [];
let dificultadSeleccionada = 'normal'; // Fácil, normal o difícil

// Límites de velocidad por dificultad
const limitesDificultad = {
    easy: {
        tiempoInicial: 5000, // 5 segundos iniciales
        tiempoMinimo: 3500, // No baja de 3.5 segundos
        tiempoMaximo: 5000,
        maxTetos: 2
    },
    normal: {
        tiempoInicial: 4000, // 4 segundos iniciales
        tiempoMinimo: 2000, // No baja de 2 segundos
        tiempoMaximo: 4000,
        maxTetos: 3
    },
    hard: {
        tiempoInicial: 3500, // 3.5 segundos iniciales
        tiempoMinimo: 1500, // No baja de 1.5 segundos
        tiempoMaximo: 3500,
        maxTetos: 5
    }
};
document.addEventListener("DOMContentLoaded", function() {
    // Inicializar arreglo de celdas
    for (let rd = 1; rd <= 9; rd++) {
        celdas[rd] = document.getElementById(rd.toString());
    }

    // Configurar el boton del cronometro
    const timerBtn = document.getElementById("timerBtn");
    timerBtn.addEventListener("click", toggleCronometro);

    // Configurar el boton de iniciar juego
    const startBtn = document.getElementById("startBtn");
    startBtn.addEventListener("click", iniciarJuego);

    // Configurar botones de dificultad
    const easyBtn = document.getElementById("easyBtn");
    const normalBtn = document.getElementById("normalBtn");
    const hardBtn = document.getElementById("hardBtn");

    easyBtn.addEventListener("click", function() {
        seleccionarDificultad("easy", easyBtn, normalBtn, hardBtn);
    });
    normalBtn.addEventListener("click", function() {
        seleccionarDificultad("normal", easyBtn, normalBtn, hardBtn);
    });
    hardBtn.addEventListener("click", function() {
        seleccionarDificultad("hard", easyBtn, normalBtn, hardBtn);
    });
});

function seleccionarDificultad(nivel, easyBtn, normalBtn, hardBtn) {
    dificultadSeleccionada = nivel;
    
    // Quitar clase active de todos
    easyBtn.classList.remove("active");
    normalBtn.classList.remove("active");
    hardBtn.classList.remove("active");
    
    // Agregar clase active al seleccionado
    if (nivel === "easy") easyBtn.classList.add("active");
    else if (nivel === "normal") normalBtn.classList.add("active");
    else if (nivel === "hard") hardBtn.classList.add("active");
    
    console.log(`Dificultad seleccionada: ${nivel}`);
}

function iniciarJuego() {
    // Resetear cronometro
    tiempoTranscurrido = 0;
    cronometroActivo = false;
    clearInterval(intervalId);
    
    // Limpiar todos los timeouts de tetos anteriores
    timeoutsTeto.forEach(t => clearTimeout(t));
    timeoutsTeto = [];
    
    const timerBtn = document.getElementById("timerBtn");
    timerBtn.textContent = "00:00";
    timerBtn.classList.remove("running");

    // Resetear puntos y dificultad según nivel seleccionado
    puntos = 0;
    dificultad = 1;
    tetosActivos = [];
    document.getElementById("scoreValue").textContent = "0";

    // Configurar parámetros iniciales según dificultad seleccionada
    const limites = limitesDificultad[dificultadSeleccionada];
    tiempoParaTeto = limites.tiempoInicial;
    numeroTetos = 1;

    // Resetear todas las celdas a baguete y asignar onclick
    for (let i = 1; i <= 9; i++) {
        celdas[i].setAttribute('src', '../images/baguete.png');
        celdas[i].onclick = manejarClick;
    }

    // Marcar juego como activo
    juegoActivo = true;

    // Iniciar cronometro automaticamente
    toggleCronometro();

    // Seleccionar celdas aleatorias para poner tetos
    spawnTetos();
}

function toggleCronometro() {
    const timerBtn = document.getElementById("timerBtn");
    
    if (cronometroActivo) {
        // Detener el cronómetro
        clearInterval(intervalId);
        cronometroActivo = false;
        timerBtn.classList.remove("running");
    } else {
        // Iniciar el cronómetro
        cronometroActivo = true;
        timerBtn.classList.add("running");
        
        intervalId = setInterval(() => {
            tiempoTranscurrido++;
            
            let minutos = Math.floor(tiempoTranscurrido / 60);
            let segundos = tiempoTranscurrido % 60;
            
            // Formatear con ceros a la izquierda
            let tiempoFormato = 
                String(minutos).padStart(2, '0') + ":" + 
                String(segundos).padStart(2, '0');
            
            timerBtn.textContent = tiempoFormato;
        }, 1000);
    }
}

function manejarClick() {
    if (!juegoActivo) return;
    
    const imagenSrc = this.src;
    const golpeTeto = document.getElementById("soundTeto");
    const golpeBaguete = document.getElementById("soundBaguete");
    const celId = this.id;
    
    if (imagenSrc.includes('teto.png')) {
        // Hizo click en TETO - sumar punto y quitar de activos
        puntos++;
        golpeTeto.currentTime = 0;
        golpeTeto.play();
        console.log("¡Golpeaste a teto! +1 punto");
        
        // Remover de tetos activos
        tetosActivos = tetosActivos.filter(t => t !== celId);
        
        // Limpiar cualquier timeout de este teto
        timeoutsTeto = timeoutsTeto.filter(t => t !== null);
        
        // Cambiar imagen a baguete
        this.setAttribute('src', '../images/baguete.png');
        
        // Aumentar dificultad según el nivel seleccionado
        aumentarDificultad();
    } else if (imagenSrc.includes('baguete.png')) {
        // Hizo click en BAGUETE - restar punto
        puntos = Math.max(0, puntos - 1);
        golpeBaguete.currentTime = 0;
        golpeBaguete.play();
        console.log("¡Golpeaste el baguete! -1 punto");
    }
    
    document.getElementById("scoreValue").textContent = puntos;
    
    // Spawnar nuevos tetos
    spawnTetos();
}

function aumentarDificultad() {
    const limites = limitesDificultad[dificultadSeleccionada];
    
    if (dificultadSeleccionada === "easy") {
        // Fácil: aumenta cada 8 puntos
        if (puntos > 0 && puntos % 8 === 0) {
            dificultad++;
            numeroTetos = Math.min(Math.ceil(dificultad / 2), limites.maxTetos);
            let tiempoCalculado = 4000 - (dificultad * 150);
            tiempoParaTeto = Math.max(limites.tiempoMinimo, Math.min(tiempoCalculado, limites.tiempoMaximo));
            console.log(`¡Nivel ${dificultad}! ${numeroTetos} tetos, ${tiempoParaTeto}ms (Límite: ${limites.tiempoMinimo}-${limites.tiempoMaximo}ms)`);
        }
    } else if (dificultadSeleccionada === "normal") {
        // Normal: aumenta cada 5 puntos
        if (puntos > 0 && puntos % 5 === 0) {
            dificultad++;
            numeroTetos = Math.min(dificultad, limites.maxTetos);
            let tiempoCalculado = 3000 - (dificultad * 250);
            tiempoParaTeto = Math.max(limites.tiempoMinimo, Math.min(tiempoCalculado, limites.tiempoMaximo));
            console.log(`¡Nivel ${dificultad}! ${numeroTetos} tetos, ${tiempoParaTeto}ms (Límite: ${limites.tiempoMinimo}-${limites.tiempoMaximo}ms)`);
        }
    } else if (dificultadSeleccionada === "hard") {
        // Difícil: aumenta cada 3 puntos
        if (puntos > 0 && puntos % 3 === 0) {
            dificultad++;
            numeroTetos = Math.min(dificultad, limites.maxTetos);
            let tiempoCalculado = 2500 - (dificultad * 200);
            tiempoParaTeto = Math.max(limites.tiempoMinimo, Math.min(tiempoCalculado, limites.tiempoMaximo));
            console.log(`¡Nivel ${dificultad}! ${numeroTetos} tetos, ${tiempoParaTeto}ms (Límite: ${limites.tiempoMinimo}-${limites.tiempoMaximo}ms)`);
        }
    }
}

function spawnTetos() {
    if (!juegoActivo) return;
    
    // Limpiar tetos anteriores que hayan desaparecido
    tetosActivos.forEach(celId => {
        const cel = celdas[celId];
        if (cel && cel.src.includes('teto.png')) {
            cel.setAttribute('src', '../images/baguete.png');
        }
    });
    
    tetosActivos = [];
    
    // Generar múltiples tetos según dificultad
    for (let i = 0; i < numeroTetos; i++) {
        let randomIndex = Math.floor(Math.random() * 9) + 1;
        
        // Evitar tetos duplicados
        while (tetosActivos.includes(randomIndex.toString())) {
            randomIndex = Math.floor(Math.random() * 9) + 1;
        }
        
        const celda = celdas[randomIndex];
        const celId = randomIndex.toString();
        
        if (celda) {
            celda.setAttribute('src', '../images/teto.png');
            tetosActivos.push(celId);
            
            // Desaparecer después de cierto tiempo
            const timeout = setTimeout(() => {
                if (juegoActivo && celda.src.includes('teto.png')) {
                    celda.setAttribute('src', '../images/baguete.png');
                    tetosActivos = tetosActivos.filter(t => t !== celId);
                    // Spawnar nuevamente
                    spawnTetos();
                }
            }, tiempoParaTeto);
            
            timeoutsTeto.push(timeout);
        }
    }
}

function click(cell) {
    if (cell && juegoActivo && cell.src.includes('teto.png')) {
        cell.setAttribute('src', '../images/baguete.png');
        cell.onclick = manejarClick;
        
        // Sumar puntos
        puntos++;
        document.getElementById("scoreValue").textContent = puntos;
        
        // Seleccionar una nueva celda aleatoria para poner teto
        spawnTetos();
    }
}

function seleccionarTetoAleatorio() {
    // Esta función ya no se usa, pero la mantenemos por compatibilidad
    spawnTetos();
}

function alerta() {
    if (juegoActivo) {
        // Esta función ya no se usa, pero la mantenemos por compatibilidad
    }
}