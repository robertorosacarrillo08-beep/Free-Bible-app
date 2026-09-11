// Función para cambiar entre testamentos
function showTestament(testament) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.testament-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Remover clase activa de todos los botones
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => {
        button.classList.remove('active');
    });

    // Mostrar la sección seleccionada
    if (testament === 'old') {
        document.getElementById('old-testament').classList.add('active');
        buttons[0].classList.add('active');
    } else if (testament === 'new') {
        document.getElementById('new-testament').classList.add('active');
        buttons[1].classList.add('active');
    }
}
